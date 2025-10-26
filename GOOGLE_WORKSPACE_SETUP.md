# Google Workspace Email Setup Guide

This guide explains how to configure Vaultify to send OTP emails using Google Workspace.

## Overview

The Vaultify backend uses **Google Workspace SMTP** to send OTP verification emails and password reset emails. This setup uses App Passwords for secure authentication.

## Prerequisites

1. Google Workspace account (workspace@yourdomain.com)
2. Admin access to Google Workspace account
3. Access to generate App Passwords

## Setup Steps

### Option 1: Using Google Workspace App Password (Recommended)

#### Step 1: Enable 2-Step Verification

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2-Step Verification if not already enabled

#### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter a name like "Vaultify Backend"
5. Click **Generate**
6. Google will display a 16-character password (e.g., `abcd efgh ijkl mnop`)
7. Copy this password (you'll need it for your `.env` file)

#### Step 3: Configure Environment Variables

Update your `.env` file with the following:

```env
# Email Configuration (Google Workspace)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=abcdefghijklmnop
```

**Important Notes:**
- `SMTP_USER` should be your full Google Workspace email address
- `SMTP_PASS` should be the 16-digit App Password (remove spaces)
- Use port `587` for TLS (recommended) or `465` for SSL

### Option 2: Using Google Workspace OAuth2 (Advanced)

For enterprise deployments, you can use OAuth2 instead of App Passwords. This requires:

1. Creating a Google Cloud Project
2. Enabling Gmail API
3. Creating OAuth2 credentials
4. Configuring refresh tokens

Contact your system administrator for OAuth2 setup.

## Configuration Details

### SMTP Settings

| Setting | Value | Description |
|---------|-------|-------------|
| Host | `smtp.gmail.com` | Google Workspace SMTP server |
| Port | `587` (TLS) or `465` (SSL) | Use 587 for TLS, 465 for SSL |
| Secure | `false` (587) or `true` (465) | TLS/SSL configuration |
| Authentication | App Password | 16-character app-specific password |

### Security Configuration

The email service is configured with:
- **Connection pooling**: Reuses connections for better performance
- **TLS verification**: Configured for Google Workspace certificates
- **Error handling**: Logs errors without breaking the application flow
- **Connection verification**: Verifies SMTP connection on startup

## Testing the Email Service

### 1. Check Connection on Startup

When the application starts, you should see:

```
Email service: Successfully connected to Google Workspace SMTP
```

If you see an error:
```
Email service: Failed to connect to SMTP server: <error message>
```

Check your `.env` configuration.

### 2. Test Registration Flow

1. Register a new user via API:
   ```bash
   POST /auth/register
   {
     "email": "test@example.com",
     "password": "password123",
     "first_name": "Test",
     "last_name": "User"
   }
   ```

2. Check console logs for:
   ```
   OTP email sent successfully: <messageId>
   ```

3. Check the user's email inbox for the OTP code

### 3. Test OTP Verification

1. Submit the OTP received via email:
   ```bash
   POST /auth/verify-otp
   {
     "user_id": "user-uuid",
     "otp": "123456"
   }
   ```

2. You should receive JWT tokens if the OTP is valid

## Troubleshooting

### Error: "Invalid login" or "Authentication failed"

**Solution:**
- Verify you're using an App Password, not your regular Google Workspace password
- Ensure 2-Step Verification is enabled on your Google account
- Check that the App Password hasn't been revoked

### Error: "Connection timeout"

**Solution:**
- Check your firewall/network settings
- Ensure port 587 (or 465) is not blocked
- Verify SMTP_HOST is correct: `smtp.gmail.com`

### Error: "Message rejected" or "Relay access denied"

**Solution:**
- Ensure your Google Workspace account allows "Less secure app access" (if not using App Passwords)
- With App Passwords, this shouldn't be an issue
- Check Google Workspace admin console for email sending restrictions

### Emails not being received

**Check:**
1. Spam/Junk folder
2. Email address is correct
3. Console logs show successful sending
4. SMTP configuration in `.env` is correct

### Connection verification fails

**Check:**
1. Internet connectivity
2. SMTP credentials are correct
3. App Password hasn't expired
4. Google Workspace account isn't suspended

## Production Recommendations

1. **Use a dedicated email address**: Create `noreply@yourdomain.com` for sending emails
2. **Set up SPF/DKIM**: Configure DNS records for your domain
3. **Monitor email logs**: Track delivery rates and failures
4. **Rate limiting**: Implement rate limiting for email sending
5. **Email templates**: Customize email templates for branding
6. **Backup SMTP**: Consider having a backup email service

## Email Templates

The system sends two types of emails:

1. **Sign-up OTP**: Beautiful HTML email with brand colors (blue theme)
2. **Password Reset OTP**: Red-themed HTML email

Both emails include:
- Professional HTML styling
- Plain text fallback
- Clear OTP code display
- Expiration notice
- Security warning

## Security Notes

- App Passwords are more secure than regular passwords
- OTPs expire after 10 minutes
- OTPs are single-use (cleared after verification)
- Failed attempts are logged for monitoring
- Email addresses are validated before sending

## Support

If you continue to experience issues:

1. Check the application logs for detailed error messages
2. Verify your `.env` configuration matches this guide
3. Test SMTP connection using a tool like Telnet
4. Contact your IT administrator for Google Workspace configuration

---

**Last Updated:** January 2024  
**Version:** 1.0

