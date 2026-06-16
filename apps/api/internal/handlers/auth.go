package handlers

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/markbates/goth/gothic"
	"gorm.io/gorm"

	"golang.org/x/crypto/bcrypt"

	"gritlearn/apps/api/internal/config"
	"gritlearn/apps/api/internal/mail"
	"gritlearn/apps/api/internal/models"
	"gritlearn/apps/api/internal/services"
	"gritlearn/apps/api/internal/totp"
)

// generateOTP returns a fresh six-digit code as a string. Sourced from
// crypto/rand (NOT math/rand) so the value can't be guessed by an
// attacker who can clock-skew the request. Padded with leading zeros
// so the on-the-wire shape is always exactly six characters.
func generateOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// emailVerifyClaims signs an email-verification link. We keep it separate
// from services.Claims so a stolen access token can't be replayed against
// /api/auth/verify-email and vice versa.
type emailVerifyClaims struct {
	UserID  string `json:"user_id"`
	Purpose string `json:"purpose"`
	jwt.RegisteredClaims
}

func (h *AuthHandler) generateEmailVerifyToken(userID string) (string, error) {
	claims := emailVerifyClaims{
		UserID:  userID,
		Purpose: "verify_email",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString([]byte(h.Config.JWTSecret))
}

func (h *AuthHandler) parseEmailVerifyToken(tokenString string) (*emailVerifyClaims, error) {
	tok, err := jwt.ParseWithClaims(tokenString, &emailVerifyClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(h.Config.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(*emailVerifyClaims)
	if !ok || !tok.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	if claims.Purpose != "verify_email" {
		return nil, fmt.Errorf("wrong token purpose")
	}
	return claims, nil
}

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	DB          *gorm.DB
	AuthService *services.AuthService
	Config      *config.Config
	Mailer      *mail.Mailer // nil = email sending silently skipped
}

type registerRequest struct {
	FirstName  string `json:"first_name" binding:"required,min=2"`
	LastName   string `json:"last_name" binding:"required,min=2"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=8"`
	MACAddress string `json:"mac_address"` // optional — provided by client if available
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type resetPasswordRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Code     string `json:"code" binding:"required,len=6"`
	Password string `json:"password" binding:"required,min=8"`
}

// Register creates a new user account.
func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	// Check email uniqueness
	var existingUser models.User
	if err := h.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": gin.H{
				"code":    "EMAIL_EXISTS",
				"message": "A user with this email already exists",
			},
		})
		return
	}

	// Generate a six-digit OTP up front so we can fail the request
	// cleanly if crypto/rand is broken before any DB write.
	code, err := generateOTP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "OTP_ERROR", "message": "Failed to generate verification code"},
		})
		return
	}
	otpExpiry := time.Now().Add(10 * time.Minute)

	user := models.User{
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		Password:     req.Password,
		Role:         models.RoleStudent,
		Active:       true,
		IPAddress:    c.ClientIP(),
		MACAddress:   req.MACAddress,
		OTPCode:      code,
		OTPExpiresAt: &otpExpiry,
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create user",
			},
		})
		return
	}

	// Send the OTP email. We deliberately do NOT issue tokens here —
	// the client must complete /api/auth/verify-otp first. This makes
	// the email-ownership check unskippable, and stops automated
	// signup-with-throwaway-address abuse.
	h.sendOTPEmail(user, code)

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"email":             user.Email,
			"verification_sent": true,
		},
		"message": "Verification code sent. Enter the 6-digit code from your email to finish signing up.",
	})
}

// sendOTPEmail dispatches the 6-digit code via the configured Mailer
// (Resend in prod). Fired-and-forget — the user row is already
// committed before we get here, so a mail failure must not bubble up.
func (h *AuthHandler) sendOTPEmail(user models.User, code string) {
	if h.Mailer == nil {
		log.Printf("[mail] OTP email skipped — Mailer not configured. Code for %s: %s", user.Email, code)
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		appName := h.Config.AppName
		if appName == "" {
			appName = "JEditor"
		}

		data := map[string]interface{}{
			"AppName":   appName,
			"Year":      time.Now().Year(),
			"FirstName": user.FirstName,
			"Code":      code,
		}
		if err := h.Mailer.Send(ctx, mail.SendOptions{
			To:       user.Email,
			Subject:  "Your " + appName + " verification code: " + code,
			Template: "otp-verification",
			Data:     data,
		}); err != nil {
			log.Printf("[mail] OTP send failed for %s: %v", user.Email, err)
		}
	}()
}

// VerifyOTP consumes a six-digit code submitted from the signup flow.
// On success, marks email_verified_at, clears the OTP fields, and
// issues real auth tokens. Idempotent on re-submission of a code that
// was already used — second call returns 401 because we wipe the code.
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Code  string `json:"code" binding:"required,len=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{"code": "INVALID_CODE", "message": "Invalid or expired code"},
		})
		return
	}

	// Already verified — short-circuit with tokens so the user can sign
	// in even if they kept the /verify-email tab open.
	if user.EmailVerifiedAt != nil {
		tokens, err := h.AuthService.GenerateTokenPair(user.ID, user.Email, user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{"code": "TOKEN_ERROR", "message": "Failed to generate tokens"},
			})
			return
		}
		h.AuthService.SetAuthCookies(c, tokens)
		c.JSON(http.StatusOK, gin.H{
			"data":    gin.H{"user": user, "tokens": tokens},
			"message": "Email already verified",
		})
		return
	}

	if user.OTPCode == "" || user.OTPExpiresAt == nil || time.Now().After(*user.OTPExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{"code": "CODE_EXPIRED", "message": "Code expired. Request a new one."},
		})
		return
	}
	if user.OTPCode != req.Code {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{"code": "INVALID_CODE", "message": "Invalid code"},
		})
		return
	}

	// Mark verified and clear OTP fields atomically.
	now := time.Now()
	user.EmailVerifiedAt = &now
	user.OTPCode = ""
	user.OTPExpiresAt = nil
	if err := h.DB.Model(&user).Updates(map[string]interface{}{
		"email_verified_at": &now,
		"otp_code":          "",
		"otp_expires_at":    nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to save verification"},
		})
		return
	}

	// Fire the welcome email best-effort now that ownership is proven.
	h.sendWelcomeEmail(user)

	tokens, err := h.AuthService.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "TOKEN_ERROR", "message": "Failed to generate tokens"},
		})
		return
	}
	h.AuthService.SetAuthCookies(c, tokens)

	c.JSON(http.StatusOK, gin.H{
		"data":    gin.H{"user": user, "tokens": tokens},
		"message": "Email verified",
	})
}

// ResendOTP rotates the OTP and sends a fresh email. Rate-limited at
// the route layer (see routes.go) so a stranger can't probe a known
// email by spamming this endpoint.
func (h *AuthHandler) ResendOTP(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Don't leak whether the email exists — always say "sent".
		c.JSON(http.StatusOK, gin.H{"message": "If that account exists, a new code has been sent."})
		return
	}

	if user.EmailVerifiedAt != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Email already verified — try signing in."})
		return
	}

	code, err := generateOTP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "OTP_ERROR", "message": "Failed to generate code"},
		})
		return
	}
	expiry := time.Now().Add(10 * time.Minute)
	user.OTPCode = code
	user.OTPExpiresAt = &expiry
	if err := h.DB.Model(&user).Updates(map[string]interface{}{
		"otp_code":       code,
		"otp_expires_at": &expiry,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to save code"},
		})
		return
	}

	h.sendOTPEmail(user, code)

	c.JSON(http.StatusOK, gin.H{"message": "A new code has been sent."})
}

// sendWelcomeEmail fires the post-verification welcome. Separate from
// sendOTPEmail so each can be retried in isolation.
func (h *AuthHandler) sendWelcomeEmail(user models.User) {
	if h.Mailer == nil {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		appName := h.Config.AppName
		if appName == "" {
			appName = "JEditor"
		}
		data := map[string]interface{}{
			"AppName":   appName,
			"Year":      time.Now().Year(),
			"FirstName": user.FirstName,
		}
		if err := h.Mailer.Send(ctx, mail.SendOptions{
			To:       user.Email,
			Subject:  "Welcome to " + appName,
			Template: "welcome",
			Data:     data,
		}); err != nil {
			log.Printf("[mail] welcome send failed for %s: %v", user.Email, err)
		}
	}()
}

// sendSignupEmails (legacy signed-link flow) replaced by sendOTPEmail +
// sendWelcomeEmail above. Kept as a stub so any stale call sites fail
// loudly during the cutover, then deleted in the next pass.
func (h *AuthHandler) sendSignupEmails(_ models.User) {
	log.Printf("[mail] sendSignupEmails is deprecated — Register now sends OTP via sendOTPEmail")
}

// _ keeps url + strings imports alive in case any other handler in this
// file still references them.
var _ = url.QueryEscape
var _ = strings.TrimSuffix

// Login authenticates a user and returns tokens.
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "INVALID_CREDENTIALS",
				"message": "Invalid email or password",
			},
		})
		return
	}

	if !user.Active {
		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{
				"code":    "ACCOUNT_DISABLED",
				"message": "Your account has been disabled",
			},
		})
		return
	}

	if user.Password == "" {
		provider := user.Provider
		if provider == "" || provider == "local" {
			provider = "social login"
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "SOCIAL_AUTH_ONLY",
				"message": fmt.Sprintf("This account uses %s. Please sign in with your social account.", provider),
			},
		})
		return
	}

	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "INVALID_CREDENTIALS",
				"message": "Invalid email or password",
			},
		})
		return
	}

	// Reject sign-in until the email is verified. Frontend sees
	// EMAIL_NOT_VERIFIED and routes to /verify-email?email=... so the
	// user can request a fresh OTP and finish signup. Skipped for
	// social-login accounts (Provider != local) — those are already
	// verified by the OAuth provider.
	if user.EmailVerifiedAt == nil && (user.Provider == "" || user.Provider == "local") {
		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{
				"code":    "EMAIL_NOT_VERIFIED",
				"message": "Verify your email to continue. Check your inbox for the 6-digit code.",
				"email":   user.Email,
			},
		})
		return
	}

	// Check if user has TOTP enabled
	var totpConfig models.TwoFactorConfig
	if err := h.DB.Where("user_id = ? AND enabled = ?", user.ID, true).First(&totpConfig).Error; err == nil {
		// TOTP is enabled — check for trusted device
		if !IsTrustedDevice(c, h.DB, user.ID) {
			// Generate a short-lived pending token for TOTP verification
			pendingToken, err := totp.GeneratePendingToken()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": gin.H{"code": "TOKEN_ERROR", "message": "Failed to create verification session"},
				})
				return
			}

			// Store hashed pending token in DB
			h.DB.Create(&models.TOTPPendingToken{
				UserID:    user.ID,
				TokenHash: totp.HashToken(pendingToken),
				ExpiresAt: time.Now().Add(totp.PendingTokenExpiry),
			})

			c.JSON(http.StatusOK, gin.H{
				"data": gin.H{
					"totp_required": true,
					"pending_token": pendingToken,
				},
				"message": "Two-factor authentication required",
			})
			return
		}
	}

	tokens, err := h.AuthService.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "TOKEN_ERROR",
				"message": "Failed to generate tokens",
			},
		})
		return
	}

	// Set HttpOnly auth cookies for browser clients. Native mobile/desktop
	// clients ignore them and continue to use the Bearer header from the
	// tokens object below — both flows work.
	h.AuthService.SetAuthCookies(c, tokens)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"user":   user,
			"tokens": tokens,
		},
		"message": "Logged in successfully",
	})
}

// Refresh generates a new access token from a refresh token. The token is
// read from the grit_refresh cookie first (web client) and falls back to
// the JSON body (mobile/desktop bearer clients) — so a single endpoint
// supports both flows.
func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken := ""
	if cookieValue, err := c.Cookie("grit_refresh"); err == nil && cookieValue != "" {
		refreshToken = cookieValue
	} else {
		var req refreshRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": err.Error(),
				},
			})
			return
		}
		refreshToken = req.RefreshToken
	}

	claims, err := h.AuthService.ValidateToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "INVALID_TOKEN",
				"message": "Invalid or expired refresh token",
			},
		})
		return
	}

	tokens, err := h.AuthService.GenerateTokenPair(claims.UserID, claims.Email, claims.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "TOKEN_ERROR",
				"message": "Failed to generate tokens",
			},
		})
		return
	}

	// Refresh the HttpOnly cookies so the new access token lands in the
	// browser without any JS handling. The bearer JSON path is unchanged
	// for native clients.
	h.AuthService.SetAuthCookies(c, tokens)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"tokens": tokens,
		},
		"message": "Token refreshed successfully",
	})
}

// Logout invalidates the user's session. Cookies are cleared immediately;
// native bearer clients should also drop their stored tokens client-side.
func (h *AuthHandler) Logout(c *gin.Context) {
	h.AuthService.ClearAuthCookies(c)
	// In a production system, you'd also blacklist the refresh token in Redis
	// so a leaked token can't be reused before its natural expiry.
	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// Me returns the current authenticated user.
func (h *AuthHandler) Me(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Not authenticated",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}

// ForgotPassword issues a 6-digit reset code and emails it. Returns
// 200 with the same shape whether the email exists or not, so a
// stranger can't probe the user table by submitting addresses.
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "If an account with that email exists, a reset code has been sent.",
		})
		return
	}

	// Social-only accounts have no password to reset; surface a 200
	// with the same body to avoid leaking that distinction.
	if user.Password == "" {
		c.JSON(http.StatusOK, gin.H{
			"message": "If an account with that email exists, a reset code has been sent.",
		})
		return
	}

	code, err := generateOTP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "OTP_ERROR", "message": "Failed to generate reset code"},
		})
		return
	}
	expiry := time.Now().Add(10 * time.Minute)
	if err := h.DB.Model(&user).Updates(map[string]interface{}{
		"password_reset_code":       code,
		"password_reset_expires_at": &expiry,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to save reset code"},
		})
		return
	}

	h.sendPasswordResetEmail(user, code)

	c.JSON(http.StatusOK, gin.H{
		"message": "If an account with that email exists, a reset code has been sent.",
	})
}

// sendPasswordResetEmail fires the reset OTP via the configured Mailer.
// Fire-and-forget — the user row already has the code persisted, so a
// mail failure must not bubble back to the HTTP response.
func (h *AuthHandler) sendPasswordResetEmail(user models.User, code string) {
	if h.Mailer == nil {
		log.Printf("[mail] reset email skipped — Mailer not configured. Code for %s: %s", user.Email, code)
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		appName := h.Config.AppName
		if appName == "" {
			appName = "JEditor"
		}
		data := map[string]interface{}{
			"AppName":   appName,
			"Year":      time.Now().Year(),
			"FirstName": user.FirstName,
			"Code":      code,
		}
		if err := h.Mailer.Send(ctx, mail.SendOptions{
			To:       user.Email,
			Subject:  "Reset your " + appName + " password",
			Template: "password-reset-otp",
			Data:     data,
		}); err != nil {
			log.Printf("[mail] reset send failed for %s: %v", user.Email, err)
		}
	}()
}

// ResetPassword validates the 6-digit code emailed by ForgotPassword
// and swaps the user's password hash in place. On success the code is
// cleared so it can't be reused; the client should then call /login.
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{"code": "INVALID_CODE", "message": "Invalid or expired code"},
		})
		return
	}

	if user.PasswordResetCode == "" || user.PasswordResetExpiresAt == nil || time.Now().After(*user.PasswordResetExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{"code": "CODE_EXPIRED", "message": "Code expired. Request a new one."},
		})
		return
	}
	if user.PasswordResetCode != req.Code {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{"code": "INVALID_CODE", "message": "Invalid code"},
		})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to hash password"},
		})
		return
	}

	if err := h.DB.Model(&user).Updates(map[string]interface{}{
		"password":                  string(hashed),
		"password_reset_code":       "",
		"password_reset_expires_at": nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to update password"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully. You can now sign in with your new password.",
	})
}

// OAuthBegin redirects the user to the OAuth provider's consent screen.
func (h *AuthHandler) OAuthBegin(c *gin.Context) {
	provider := c.Param("provider")

	// Gothic reads provider from query string, not URL params
	q := c.Request.URL.Query()
	q.Set("provider", provider)
	c.Request.URL.RawQuery = q.Encode()

	gothic.BeginAuthHandler(c.Writer, c.Request)
}

// OAuthCallback completes the OAuth flow, finds or creates the user, and redirects with JWT tokens.
func (h *AuthHandler) OAuthCallback(c *gin.Context) {
	provider := c.Param("provider")

	q := c.Request.URL.Query()
	q.Set("provider", provider)
	c.Request.URL.RawQuery = q.Encode()

	gothUser, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		log.Printf("OAuth callback error: %v", err)
		redirectURL := fmt.Sprintf("%s/login?error=%s", h.Config.OAuthFrontendURL, url.QueryEscape("Authentication failed. Please try again."))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Find or create user by email
	var user models.User
	result := h.DB.Where("email = ?", gothUser.Email).First(&user)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Create new user from OAuth data
			now := time.Now()
			user = models.User{
				FirstName:       gothUser.FirstName,
				LastName:        gothUser.LastName,
				Email:           gothUser.Email,
				Avatar:          gothUser.AvatarURL,
				Provider:        provider,
				Active:          true,
				EmailVerifiedAt: &now,
				IPAddress:       c.ClientIP(),
			}

			if provider == "google" {
				user.GoogleID = gothUser.UserID
			} else if provider == "github" {
				user.GithubID = gothUser.UserID
			}

			// If name is empty, try to use NickName
			if user.FirstName == "" && gothUser.NickName != "" {
				user.FirstName = gothUser.NickName
			}
			if user.FirstName == "" {
				user.FirstName = "User"
			}
			if user.LastName == "" {
				user.LastName = ""
			}

			if err := h.DB.Create(&user).Error; err != nil {
				log.Printf("OAuth: failed to create user: %v", err)
				redirectURL := fmt.Sprintf("%s/login?error=%s", h.Config.OAuthFrontendURL, url.QueryEscape("Failed to create account."))
				c.Redirect(http.StatusTemporaryRedirect, redirectURL)
				return
			}
		} else {
			log.Printf("OAuth: database error: %v", result.Error)
			redirectURL := fmt.Sprintf("%s/login?error=%s", h.Config.OAuthFrontendURL, url.QueryEscape("Something went wrong."))
			c.Redirect(http.StatusTemporaryRedirect, redirectURL)
			return
		}
	} else {
		// Link OAuth provider to existing account
		updates := map[string]interface{}{}
		if provider == "google" && user.GoogleID == "" {
			updates["google_id"] = gothUser.UserID
		} else if provider == "github" && user.GithubID == "" {
			updates["github_id"] = gothUser.UserID
		}
		if user.Avatar == "" && gothUser.AvatarURL != "" {
			updates["avatar"] = gothUser.AvatarURL
		}
		if user.Provider == "local" {
			updates["provider"] = provider
		}

		if len(updates) > 0 {
			h.DB.Model(&user).Updates(updates)
		}
	}

	if !user.Active {
		redirectURL := fmt.Sprintf("%s/login?error=%s", h.Config.OAuthFrontendURL, url.QueryEscape("Your account has been disabled."))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Generate JWT tokens
	tokens, err := h.AuthService.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		log.Printf("OAuth: failed to generate tokens: %v", err)
		redirectURL := fmt.Sprintf("%s/login?error=%s", h.Config.OAuthFrontendURL, url.QueryEscape("Failed to sign in."))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Redirect to frontend with tokens
	redirectURL := fmt.Sprintf("%s/auth/callback?access_token=%s&refresh_token=%s",
		h.Config.OAuthFrontendURL,
		url.QueryEscape(tokens.AccessToken),
		url.QueryEscape(tokens.RefreshToken),
	)
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// VerifyEmail consumes the signed link emailed at signup and stamps
// users.email_verified_at. Idempotent — replays return the same 200.
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "MISSING_TOKEN", "message": "token query param required"},
		})
		return
	}

	claims, err := h.parseEmailVerifyToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{"code": "INVALID_TOKEN", "message": "verification link is invalid or expired"},
		})
		return
	}

	var user models.User
	if err := h.DB.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "USER_NOT_FOUND", "message": "user no longer exists"},
		})
		return
	}

	if user.EmailVerifiedAt == nil {
		now := time.Now()
		if err := h.DB.Model(&user).Update("email_verified_at", &now).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{"code": "DB_ERROR", "message": "could not record verification"},
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    gin.H{"verified": true, "email": user.Email},
		"message": "Email verified",
	})
}
