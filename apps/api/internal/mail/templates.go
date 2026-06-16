package mail

// EmailTemplates contains all available email templates.
var EmailTemplates = map[string]string{
	"welcome":            welcomeTemplate,
	"password-reset":     passwordResetTemplate,
	"email-verification": emailVerificationTemplate,
	"otp-verification":   otpVerificationTemplate,
	"notification":       notificationTemplate,
}

const otpVerificationTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0d; color: #ededee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #111114; border: 1px solid #1f1f25; border-radius: 12px; padding: 32px; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 22px; font-weight: 700; color: #5FE3B0; letter-spacing: -0.5px; }
    h1 { font-size: 22px; margin: 0 0 14px; color: #ededee; text-align: center; }
    p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 14px; text-align: center; }
    .code { background-color: #0a0a0d; border: 1px solid #1f1f25; border-radius: 12px; padding: 22px; text-align: center; font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace; font-size: 36px; letter-spacing: 12px; font-weight: 700; color: #5FE3B0; margin: 22px 0; }
    .hint { font-size: 12px; color: #71717a; text-align: center; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">{{.AppName}}</div>
      <h1>Verify your email</h1>
      <p>Hi {{.FirstName}}, use this code to finish creating your {{.AppName}} account.</p>
      <div class="code">{{.Code}}</div>
      <p class="hint">Code expires in 10 minutes. If you didn't try to sign up, ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; {{.Year}} {{.AppName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

const baseLayout = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0f; color: #e8e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #111118; border: 1px solid #2a2a3a; border-radius: 12px; padding: 32px; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #6c5ce7; }
    h1 { font-size: 20px; margin: 0 0 16px; color: #e8e8f0; }
    p { font-size: 14px; line-height: 1.6; color: #9090a8; margin: 0 0 16px; }
    .btn { display: inline-block; background-color: #6c5ce7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .btn:hover { background-color: #7c6cf7; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #606078; }
    .code { background-color: #1a1a24; border: 1px solid #2a2a3a; border-radius: 8px; padding: 16px; text-align: center; font-size: 28px; letter-spacing: 4px; font-weight: 700; color: #6c5ce7; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">{{.AppName}}</div>
      {{.Content}}
    </div>
    <div class="footer">
      <p>&copy; {{.Year}} {{.AppName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

const welcomeTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0f; color: #e8e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #111118; border: 1px solid #2a2a3a; border-radius: 12px; padding: 32px; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #6c5ce7; }
    h1 { font-size: 20px; margin: 0 0 16px; color: #e8e8f0; }
    p { font-size: 14px; line-height: 1.6; color: #9090a8; margin: 0 0 16px; }
    .btn { display: inline-block; background-color: #6c5ce7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #606078; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">{{.AppName}}</div>
      <h1>Welcome, {{.Name}}!</h1>
      <p>Thanks for signing up. Your account is ready to use.</p>
      <p>Get started by exploring the dashboard:</p>
      <p style="text-align: center; margin-top: 24px;">
        <a href="{{.DashboardURL}}" class="btn">Go to Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{.Year}} {{.AppName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

const passwordResetTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0f; color: #e8e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #111118; border: 1px solid #2a2a3a; border-radius: 12px; padding: 32px; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #6c5ce7; }
    h1 { font-size: 20px; margin: 0 0 16px; color: #e8e8f0; }
    p { font-size: 14px; line-height: 1.6; color: #9090a8; margin: 0 0 16px; }
    .btn { display: inline-block; background-color: #6c5ce7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #606078; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">{{.AppName}}</div>
      <h1>Reset Your Password</h1>
      <p>We received a request to reset your password. Click the button below to set a new one:</p>
      <p style="text-align: center; margin-top: 24px;">
        <a href="{{.ResetURL}}" class="btn">Reset Password</a>
      </p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; {{.Year}} {{.AppName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

const emailVerificationTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0f; color: #e8e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #111118; border: 1px solid #2a2a3a; border-radius: 12px; padding: 32px; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #6c5ce7; }
    h1 { font-size: 20px; margin: 0 0 16px; color: #e8e8f0; }
    p { font-size: 14px; line-height: 1.6; color: #9090a8; margin: 0 0 16px; }
    .btn { display: inline-block; background-color: #6c5ce7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #606078; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">{{.AppName}}</div>
      <h1>Verify Your Email</h1>
      <p>Please verify your email address by clicking the button below:</p>
      <p style="text-align: center; margin-top: 24px;">
        <a href="{{.VerifyURL}}" class="btn">Verify Email</a>
      </p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; {{.Year}} {{.AppName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

const notificationTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0f; color: #e8e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #111118; border: 1px solid #2a2a3a; border-radius: 12px; padding: 32px; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #6c5ce7; }
    h1 { font-size: 20px; margin: 0 0 16px; color: #e8e8f0; }
    p { font-size: 14px; line-height: 1.6; color: #9090a8; margin: 0 0 16px; }
    .btn { display: inline-block; background-color: #6c5ce7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #606078; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">{{.AppName}}</div>
      <h1>{{.Title}}</h1>
      <p>{{.Message}}</p>
      {{if .ActionURL}}
      <p style="text-align: center; margin-top: 24px;">
        <a href="{{.ActionURL}}" class="btn">{{.ActionText}}</a>
      </p>
      {{end}}
    </div>
    <div class="footer">
      <p>&copy; {{.Year}} {{.AppName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
