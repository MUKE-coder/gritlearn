package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	gothGithub "github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"

	"gritlearn/apps/api/internal/ai"
	"gritlearn/apps/api/internal/cache"
	"gritlearn/apps/api/internal/config"
	"gritlearn/apps/api/internal/cron"
	"gritlearn/apps/api/internal/database"
	"gritlearn/apps/api/internal/jobs"
	"gritlearn/apps/api/internal/mail"
	"gritlearn/apps/api/internal/routes"
	"gritlearn/apps/api/internal/services"
	"gritlearn/apps/api/internal/storage"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// ── Phase 4 Services ─────────────────────────────────────────

	// Redis cache
	var cacheService *cache.Cache
	if cfg.RedisURL != "" {
		c, err := cache.New(cfg.RedisURL)
		if err != nil {
			log.Printf("Warning: Redis unavailable: %v (caching disabled)", err)
		} else {
			cacheService = c
			log.Println("Redis cache connected")
		}
	}

	// File storage (S3-compatible)
	var storageService *storage.Storage
	if cfg.Storage.Endpoint != "" && cfg.Storage.AccessKey != "" {
		s, err := storage.New(cfg.Storage)
		if err != nil {
			log.Printf("Warning: Storage unavailable: %v (uploads disabled)", err)
		} else {
			storageService = s
			log.Println("File storage connected")
		}
	}

	// Email — prefer SMTP (Mailhog in dev) when SMTP_HOST is set;
	// otherwise fall back to Resend for production. Either way the
	// rest of the app sees the same *mail.Mailer.
	var mailer *mail.Mailer
	switch {
	case cfg.SMTPHost != "":
		mailer = mail.NewSMTP(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.MailFrom)
		log.Printf("Email service configured (SMTP %s:%s, from %s)", cfg.SMTPHost, cfg.SMTPPort, cfg.MailFrom)
	case cfg.ResendAPIKey != "" && cfg.ResendAPIKey != "re_your_api_key":
		mailer = mail.New(cfg.ResendAPIKey, cfg.MailFrom)
		log.Println("Email service configured (Resend)")
	default:
		log.Println("Warning: No mail backend configured (set SMTP_HOST or RESEND_API_KEY)")
	}

	// AI service (Vercel AI Gateway)
	var aiService *ai.AI
	if cfg.AIGatewayAPIKey != "" {
		aiService = ai.New(cfg.AIGatewayAPIKey, cfg.AIGatewayModel, cfg.AIGatewayURL)
		log.Printf("AI service configured via AI Gateway (%s)", cfg.AIGatewayModel)
	}

	// Background jobs (asynq)
	var jobClient *jobs.Client
	if cfg.RedisURL != "" {
		jc, err := jobs.NewClient(cfg.RedisURL)
		if err != nil {
			log.Printf("Warning: Job queue unavailable: %v", err)
		} else {
			jobClient = jc
			log.Println("Job queue connected")
		}
	}

	// OAuth2 social login providers
	gothic.Store = sessions.NewCookieStore([]byte(cfg.JWTSecret))
	var oauthProviders []goth.Provider
	if cfg.GoogleClientID != "" {
		oauthProviders = append(oauthProviders, google.New(
			cfg.GoogleClientID, cfg.GoogleClientSecret,
			cfg.AppURL+"/api/auth/oauth/google/callback",
		))
		log.Println("Google OAuth2 configured")
	}
	if cfg.GithubClientID != "" {
		oauthProviders = append(oauthProviders, gothGithub.New(
			cfg.GithubClientID, cfg.GithubClientSecret,
			cfg.AppURL+"/api/auth/oauth/github/callback",
		))
		log.Println("GitHub OAuth2 configured")
	}
	if len(oauthProviders) > 0 {
		goth.UseProviders(oauthProviders...)
	}

	// Build services
	var secObsBridge *services.SecObsBridge
	if cfg.SentinelEnabled || cfg.PulseEnabled {
		secObsBridge = services.NewSecObsBridge(cfg)
	}

	svc := &routes.Services{
		Cache:   cacheService,
		Storage: storageService,
		Mailer:  mailer,
		AI:      aiService,
		Jobs:    jobClient,
		SecObs:  secObsBridge,
	}

	// Setup router
	router := routes.Setup(db, cfg, svc)

	// Start the SecObs notification poller (turns Sentinel/Pulse findings
	// into in-app notifications). Runs once a minute on its own goroutine;
	// no-op when the bridge is nil.
	var secObsPoller *services.SecObsPoller
	if secObsBridge != nil {
		secObsPoller = services.NewSecObsPoller(db, secObsBridge)
		secObsPoller.Start()
	}

	// Start background worker
	var workerStop func()
	if cfg.RedisURL != "" {
		stop, err := jobs.StartWorker(cfg.RedisURL, jobs.WorkerDeps{
			DB:      db,
			Mailer:  mailer,
			Storage: storageService,
			Cache:   cacheService,
		})
		if err != nil {
			log.Printf("Warning: Background worker failed to start: %v", err)
		} else {
			workerStop = stop
			log.Println("Background worker started")
		}
	}

	// Start cron scheduler
	var cronScheduler *cron.Scheduler
	if cfg.RedisURL != "" {
		cs, err := cron.New(cfg.RedisURL)
		if err != nil {
			log.Printf("Warning: Cron scheduler failed to start: %v", err)
		} else {
			cronScheduler = cs
			if err := cs.Start(); err != nil {
				log.Printf("Warning: Cron scheduler failed to start: %v", err)
			} else {
				log.Println("Cron scheduler started")
			}
		}
	}

	// Create server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		log.Printf("GORM Studio available at http://localhost:%s/studio", cfg.Port)
		log.Printf("API Documentation at http://localhost:%s/docs", cfg.Port)
		if cfg.PulseEnabled {
			log.Printf("Pulse dashboard at http://localhost:%s/pulse/ui/", cfg.Port)
		}
		if cfg.SentinelEnabled {
			log.Printf("Sentinel dashboard at http://localhost:%s/sentinel/ui", cfg.Port)
		}
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	if secObsPoller != nil {
		secObsPoller.Stop()
	}

	// Stop cron scheduler
	if cronScheduler != nil {
		cronScheduler.Stop()
	}

	// Stop background worker
	if workerStop != nil {
		workerStop()
	}

	// Close job client
	if jobClient != nil {
		jobClient.Close()
	}

	// Close cache connection
	if cacheService != nil {
		cacheService.Close()
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
