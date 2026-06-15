package mail

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"net/smtp"
	"strings"
	"time"
)

// Mailer sends emails. In dev (when smtpHost is set) it talks to an SMTP
// relay such as Mailhog; otherwise it falls back to the Resend HTTP API.
// We expose both paths through a single Send/SendRaw surface so callers
// don't care which backend handles the message.
type Mailer struct {
	apiKey   string
	from     string
	client   *http.Client
	smtpHost string // empty = use Resend
	smtpPort string
	smtpUser string
	smtpPass string
}

// New creates a Resend-backed Mailer (production default).
func New(apiKey, from string) *Mailer {
	return &Mailer{
		apiKey: apiKey,
		from:   from,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// NewSMTP creates an SMTP-backed Mailer (dev with Mailhog, or any SMTP
// relay). user/pass may be empty for unauthenticated relays like Mailhog.
func NewSMTP(host, port, user, pass, from string) *Mailer {
	return &Mailer{
		from:     from,
		smtpHost: host,
		smtpPort: port,
		smtpUser: user,
		smtpPass: pass,
	}
}

// SendOptions configures an email to send.
type SendOptions struct {
	To       string
	Subject  string
	Template string
	Data     map[string]interface{}
}

// Send renders a template and sends the email via the configured backend.
func (m *Mailer) Send(ctx context.Context, opts SendOptions) error {
	htmlBody, err := m.renderTemplate(opts.Template, opts.Data)
	if err != nil {
		return fmt.Errorf("rendering template %q: %w", opts.Template, err)
	}
	return m.SendRaw(ctx, opts.To, opts.Subject, htmlBody)
}

// SendRaw sends an email with raw HTML content (no template rendering).
func (m *Mailer) SendRaw(ctx context.Context, to, subject, htmlBody string) error {
	if m.smtpHost != "" {
		return m.sendSMTP(to, subject, htmlBody)
	}
	return m.sendResend(ctx, to, subject, htmlBody)
}

func (m *Mailer) sendResend(ctx context.Context, to, subject, htmlBody string) error {
	payload := map[string]interface{}{
		"from":    m.from,
		"to":      []string{to},
		"subject": subject,
		"html":    htmlBody,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshaling email payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("sending email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errResp map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("resend API error (%d): %v", resp.StatusCode, errResp)
	}

	return nil
}

// sendSMTP delivers via plain SMTP (Mailhog in dev, any SMTP relay otherwise).
// Auth is skipped when smtpUser is empty (Mailhog accepts unauthenticated mail).
func (m *Mailer) sendSMTP(to, subject, htmlBody string) error {
	addr := m.smtpHost + ":" + m.smtpPort

	var auth smtp.Auth
	if m.smtpUser != "" {
		auth = smtp.PlainAuth("", m.smtpUser, m.smtpPass, m.smtpHost)
	}

	var msg strings.Builder
	msg.WriteString("From: " + m.from + "\r\n")
	msg.WriteString("To: " + to + "\r\n")
	msg.WriteString("Subject: " + subject + "\r\n")
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	if err := smtp.SendMail(addr, auth, m.from, []string{to}, []byte(msg.String())); err != nil {
		return fmt.Errorf("smtp send to %s: %w", addr, err)
	}
	return nil
}

func (m *Mailer) renderTemplate(name string, data map[string]interface{}) (string, error) {
	tmplStr, ok := EmailTemplates[name]
	if !ok {
		return "", fmt.Errorf("template %q not found", name)
	}

	tmpl, err := template.New(name).Parse(tmplStr)
	if err != nil {
		return "", fmt.Errorf("parsing template %q: %w", name, err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("executing template %q: %w", name, err)
	}

	return buf.String(), nil
}
