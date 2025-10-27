# Firebase Setup Guide

This guide explains how to configure Firebase for Vaultify push notifications.

## Overview

Vaultify supports two methods for Firebase configuration:
1. **JSON Credentials** (Recommended for deployment)
2. **Individual Credentials** (Legacy method)

## Method 1: JSON Credentials (Recommended)

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click on the **gear icon** ⚙️ next to "Project Overview"
4. Select **Project Settings**
5. Go to the **Service Accounts** tab
6. Click **Generate New Private Key**
7. Click **Generate Key** in the dialog
8. A JSON file will be downloaded (e.g., `vaultify-firebase-key.json`)

### Step 2: Configure Environment Variable

The downloaded JSON file will look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 3: Add to .env

**For Local Development:**

Open your `.env` file and add the entire JSON as a single line:

```env
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com","client_id":"123456789...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
```

**Important Notes:**
- Escape newlines in the private_key with `\\n`
- The entire JSON must be on a single line
- Keep the quotes around the JSON object

**For Production Deployment (e.g., Heroku, Railway, AWS):**

Use your platform's environment variable configuration:

```bash
# Heroku
heroku config:set GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'

# Railway
# Add GOOGLE_APPLICATION_CREDENTIALS_JSON in the Variables tab

# AWS / Docker
# Add to your .env file or environment configuration
```

### Step 4: Verify Configuration

Start your application and check the logs:

```
[Nest] Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS_JSON
[Nest] Firebase initialized successfully
```

If you see warnings, check that your JSON is properly formatted.

## Method 2: Individual Credentials (Legacy)

If you prefer to use individual environment variables:

### Step 1: Get Firebase Service Account Key

Follow the same steps as Method 1 to download the JSON file.

### Step 2: Extract Values

From your JSON file, extract:

- `project_id` → `FIREBASE_PROJECT_ID`
- `private_key` → `FIREBASE_PRIVATE_KEY`
- `client_email` → `FIREBASE_CLIENT_EMAIL`

### Step 3: Add to .env

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Note:** The private key may have newlines. They should be preserved as-is.

### Step 4: Verify Configuration

Start your application and check the logs:

```
[Nest] Firebase initialized with individual credentials
[Nest] Firebase initialized successfully
```

## Using Either Method

The application will automatically detect which method you're using:

- If `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set, it uses the JSON method
- Otherwise, it falls back to individual credentials
- If neither is configured, push notifications will be disabled

## Troubleshooting

### Error: "Firebase configuration is incomplete"

**Solution:**
- Check that all required environment variables are set
- Verify that the JSON is properly formatted (for Method 1)
- Check that individual credentials have the correct values (for Method 2)

### Error: "Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON"

**Solution:**
- Ensure the JSON is properly escaped
- Check that newlines in `private_key` are escaped as `\\n`
- Verify the JSON is valid (use a JSON validator)

### Error: "Firebase Admin SDK initialization error"

**Solution:**
- Verify the service account key is valid
- Check that the service account has the correct permissions
- Ensure the Firebase project is active

### Push Notifications Not Working

**Check:**
1. Verify Firebase is initialized (check application logs)
2. Ensure device tokens are registered in the database
3. Test with a valid device token
4. Check Firebase Console for error reports

## Security Best Practices

1. **Never commit credentials to Git**
   - The `.env` file should be in `.gitignore`
   - Use platform-specific secret management

2. **Rotate keys regularly**
   - Generate new keys in Firebase Console
   - Update environment variables
   - Test before deploying to production

3. **Use least privilege**
   - Grant only necessary permissions to service accounts
   - Use separate keys for different environments (dev, staging, prod)

4. **For Production:**
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault)
   - Enable encryption at rest for secrets
   - Monitor access to credentials

## Testing

### Test Push Notification Setup

1. Start the application
2. Check console for Firebase initialization logs
3. Register a device token via your mobile app
4. Send a test notification:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "targetId": "USER_ID",
    "title": "Test Notification",
    "body": "This is a test",
    "data": {}
  }'
```

## Firebase Console Features

### Enable Push Notifications

1. Go to **Project Settings** → **Cloud Messaging**
2. Enable **Cloud Messaging API**
3. Configure your app's package name and SHA-256 certificate

### Monitor Usage

1. Go to **Firebase Console** → **Analytics** → **Events**
2. Track notification delivery rates
3. Monitor errors and failures

### Test Notifications

1. Use Firebase Console → **Cloud Messaging**
2. Send test notifications directly from the console
3. Check delivery status in the console

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Service Accounts Guide](https://firebase.google.com/docs/admin/setup#service-accounts)

---

**Last Updated:** January 2024  
**Version:** 1.0

