# Linode S3 Upload Troubleshooting Guide

## Error: InvalidAccessKeyId (403)

This error means Linode Object Storage cannot authenticate with the provided credentials.

### Common Causes & Solutions

#### 1. **Credentials in .env file have quotes**
❌ **Wrong:**
```env
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

✅ **Correct:**
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Solution:** Remove quotes from your credentials in the `.env` file.

#### 2. **Credentials have extra spaces**
❌ **Wrong:**
```env
AWS_ACCESS_KEY_ID= your-access-key 
AWS_SECRET_ACCESS_KEY= your-secret-key 
```

✅ **Correct:**
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Solution:** Remove spaces before and after the `=` sign and at the end of values.

#### 3. **Wrong credentials**
- Verify your credentials in Linode Cloud Manager
- Go to: **Object Storage > Access Keys**
- Make sure you're using the correct Access Key ID and Secret Access Key

#### 4. **Endpoint format**
✅ **Correct format:**
```env
AWS_S3_ENDPOINT=https://us-east-1.linodeobjects.com
```

**Note:** Include the `https://` protocol.

#### 5. **Region mismatch**
Make sure your `AWS_REGION` matches your bucket's region:
- US East (Newark): `us-east-1`
- US West (Fremont): `us-west-1`
- EU West (London): `eu-west-1`
- AP South (Singapore): `ap-south-1`

#### 6. **Bucket doesn't exist**
- Verify the bucket name in Linode Cloud Manager
- Make sure `AWS_S3_BUCKET` matches exactly (case-sensitive)

### Verification Steps

1. **Check your .env file:**
   ```bash
   # Make sure these are set correctly (no quotes, no spaces)
   AWS_ACCESS_KEY_ID=your-actual-key
   AWS_SECRET_ACCESS_KEY=your-actual-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   AWS_S3_ENDPOINT=https://us-east-1.linodeobjects.com
   ```

2. **Check Docker logs for S3 Configuration:**
   ```bash
   docker-compose logs app | grep "S3 Configuration"
   ```
   
   You should see:
   ```
   S3 Configuration: {
     hasAccessKeyId: true,
     accessKeyIdLength: <number>,
     hasSecretAccessKey: true,
     secretAccessKeyLength: <number>,
     region: 'us-east-1',
     bucket: 'your-bucket-name',
     endpoint: 'https://us-east-1.linodeobjects.com'
   }
   ```

3. **Test credentials with Linode CLI:**
   ```bash
   linode-cli obj ls
   ```

### Quick Fix Checklist

- [ ] Removed quotes from credentials in `.env`
- [ ] Removed spaces around `=` in `.env`
- [ ] Verified credentials in Linode Cloud Manager
- [ ] Checked endpoint format (includes `https://`)
- [ ] Verified region matches bucket region
- [ ] Verified bucket name is correct (case-sensitive)
- [ ] Restarted Docker containers after changes

### After Making Changes

1. **Restart Docker:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **Check logs:**
   ```bash
   docker-compose logs app --tail 50
   ```

3. **Try uploading again**

### Still Not Working?

Check the detailed error in Docker logs:
```bash
docker-compose logs app | grep "S3 Upload Error"
```

The error will show:
- Error code
- Status code
- Full error details

Share these details for further troubleshooting.

