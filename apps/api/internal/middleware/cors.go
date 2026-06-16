package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS creates a CORS middleware with the given allowed origins.
func CORS(allowedOrigins []string) gin.HandlerFunc {
	originsMap := make(map[string]bool)
	for _, origin := range allowedOrigins {
		originsMap[origin] = true
	}

	// Routes that are always public — the desktop's heartbeat hits
	// /api/health to compute the "Online/Offline" badge, and any
	// client (browser, Wails WebView, curl, monitoring) needs to be
	// able to hit them regardless of their Origin. Without this the
	// desktop shows "Offline" whenever WebView2 sends an unexpected
	// Origin (null, wails://, etc.) that isn't in the exact-match
	// allowlist.
	publicPaths := map[string]bool{
		"/api/health":              true,
		"/api/desktop/latest":      true,
		"/api/desktop/download":    true,
		"/api/desktop/diagnostics": true,
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// 1. Public path — echo any origin (including * fallback).
		// 2. Allowlisted origin — echo it back.
		// 3. Otherwise — no ACAO header (browser rejects).
		switch {
		case publicPaths[c.Request.URL.Path]:
			if origin != "" {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Vary", "Origin")
			} else {
				c.Header("Access-Control-Allow-Origin", "*")
			}
		case originsMap[origin]:
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, Idempotency-Key")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
