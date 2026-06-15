package handlers

import (
	"context"
	"fmt"
	"log"
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
	Token    string `json:"token" binding:"required"`
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

	user := models.User{
		FirstName:  req.FirstName,
		LastName:   req.LastName,
		Email:      req.Email,
		Password:   req.Password,
		Role:       models.RoleStudent,
		Active:     true,
		IPAddress:  c.ClientIP(),
		MACAddress: req.MACAddress,
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

	// Set HttpOnly auth cookies for browser clients.
	h.AuthService.SetAuthCookies(c, tokens)

	// Fire welcome + verification emails best-effort. We don't fail the
	// signup if Mailhog is down — the user is already created.
	h.sendSignupEmails(user)

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"user":   user,
			"tokens": tokens,
		},
		"message": "User registered successfully",
	})
}

// sendSignupEmails fires the welcome and email-verification messages in
// the background. The user has already been persisted by the time we get
// here, so a Mailer failure must NOT bubble up to the HTTP response.
func (h *AuthHandler) sendSignupEmails(user models.User) {
	if h.Mailer == nil {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		appName := h.Config.AppName
		if appName == "" {
			appName = "GritLearn"
		}

		// Welcome email — fired-and-forget; failures only get logged.
		welcomeData := map[string]interface{}{
			"AppName":   appName,
			"Year":      time.Now().Year(),
			"FirstName": user.FirstName,
		}
		if err := h.Mailer.Send(ctx, mail.SendOptions{
			To:       user.Email,
			Subject:  "Welcome to " + appName,
			Template: "welcome",
			Data:     welcomeData,
		}); err != nil {
			log.Printf("[mail] welcome send failed for %s: %v", user.Email, err)
		}

		// Verification email — link the user clicks to confirm ownership.
		token, err := h.generateEmailVerifyToken(user.ID)
		if err != nil {
			log.Printf("[mail] verify token gen failed for %s: %v", user.Email, err)
			return
		}
		verifyURL := strings.TrimSuffix(h.Config.AppURL, "/") + "/api/auth/verify-email?token=" + url.QueryEscape(token)
		verifyData := map[string]interface{}{
			"AppName":   appName,
			"Year":      time.Now().Year(),
			"FirstName": user.FirstName,
			"VerifyURL": verifyURL,
		}
		if err := h.Mailer.Send(ctx, mail.SendOptions{
			To:       user.Email,
			Subject:  "Verify your " + appName + " email",
			Template: "email-verification",
			Data:     verifyData,
		}); err != nil {
			log.Printf("[mail] verification send failed for %s: %v", user.Email, err)
		}
	}()
}

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

// ForgotPassword initiates a password reset.
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
		// Return success even if email not found (security)
		c.JSON(http.StatusOK, gin.H{
			"message": "If an account with that email exists, a password reset link has been sent",
		})
		return
	}

	token, err := services.GenerateResetToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate reset token",
			},
		})
		return
	}

	// For Phase 1, just log the token (email integration comes in Phase 4)
	log.Printf("Password reset token for %s: %s", user.Email, token)

	c.JSON(http.StatusOK, gin.H{
		"message": "If an account with that email exists, a password reset link has been sent",
	})
}

// ResetPassword resets a user's password with a valid token.
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

	// Phase 1: simplified reset (in production, validate the token against stored tokens)
	// For now, this is a placeholder that demonstrates the API contract
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to hash password",
			},
		})
		return
	}
	_ = hashedPassword

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully",
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
