import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3UploadService {
  private s3: AWS.S3;
  private bucket: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    // Try reading from both config path and direct env
    // Supports multiple naming conventions for compatibility
    const accessKeyId = this.configService.get<string>('app.aws.accessKeyId') || 
                       this.configService.get<string>('AWS_ACCESS_KEY_ID') ||
                       process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = this.configService.get<string>('app.aws.secretAccessKey') || 
                           this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
                           process.env.AWS_SECRET_ACCESS_KEY;
    const region = this.configService.get<string>('app.aws.region') || 
                   this.configService.get<string>('AWS_S3_REGION_NAME') ||
                   this.configService.get<string>('AWS_REGION') ||
                   process.env.AWS_S3_REGION_NAME ||
                   process.env.AWS_REGION || 
                   'us-southeast-1';
    this.bucket = this.configService.get<string>('app.aws.s3Bucket') || 
                  this.configService.get<string>('AWS_STORAGE_BUCKET_NAME') ||
                  this.configService.get<string>('AWS_S3_BUCKET') ||
                  process.env.AWS_STORAGE_BUCKET_NAME ||
                  process.env.AWS_S3_BUCKET || 
                  'vaultify';
    this.endpoint = this.configService.get<string>('app.aws.s3Endpoint') || 
                    this.configService.get<string>('AWS_S3_ENDPOINT_URL') ||
                    this.configService.get<string>('AWS_S3_ENDPOINT') ||
                    process.env.AWS_S3_ENDPOINT_URL ||
                    process.env.AWS_S3_ENDPOINT || 
                    'https://us-southeast-1.linodeobjects.com';

    // Debug logging (remove sensitive data in production)
    console.log('S3 Configuration:', {
      hasAccessKeyId: !!accessKeyId,
      accessKeyIdLength: accessKeyId?.length || 0,
      hasSecretAccessKey: !!secretAccessKey,
      secretAccessKeyLength: secretAccessKey?.length || 0,
      region,
      bucket: this.bucket,
      endpoint: this.endpoint,
    });

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
    }

    // Trim whitespace from credentials (common issue)
    const trimmedAccessKeyId = accessKeyId.trim();
    const trimmedSecretAccessKey = secretAccessKey.trim();

    // Configure S3 client for Linode Object Storage
    // For Linode, we need to ensure the endpoint is properly formatted
    const endpoint = this.endpoint.startsWith('http') 
      ? this.endpoint 
      : `https://${this.endpoint}`;
    
    this.s3 = new AWS.S3({
      accessKeyId: trimmedAccessKeyId,
      secretAccessKey: trimmedSecretAccessKey,
      region,
      endpoint: endpoint,
      s3ForcePathStyle: true, // Required for Linode Object Storage
      signatureVersion: 'v4',
    });
    
    // Log configuration (without sensitive data)
    console.log('S3 Client Configured:', {
      endpoint,
      region,
      bucket: this.bucket,
      accessKeyIdPrefix: trimmedAccessKeyId.substring(0, 5) + '...',
      hasSecretKey: !!trimmedSecretAccessKey,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'service-charges'
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check if file buffer exists (multer memory storage)
    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing. Please ensure multer is configured with memory storage.');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Generate unique file name
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      // Upload to S3 (Linode Object Storage may not support ACL, so we omit it)
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // Try to set ACL, but don't fail if it's not supported
      try {
        uploadParams.ACL = 'public-read';
      } catch (e) {
        // ACL not supported, continue without it
      }

      const uploadResult = await this.s3.upload(uploadParams).promise();

      // Construct public URL for Linode Object Storage
      // Format: https://endpoint/bucket-name/key
      const publicUrl = uploadResult.Location || 
        `${this.endpoint}/${this.bucket}/${fileName}`;

      return {
        url: publicUrl,
        key: fileName,
      };
    } catch (error: any) {
      // Log full error for debugging
      console.error('S3 Upload Error Details:', {
        message: error?.message,
        code: error?.code,
        statusCode: error?.statusCode,
        requestId: error?.requestId,
        region: error?.region,
        endpoint: this.endpoint,
        bucket: this.bucket,
        errorName: error?.name,
        errorStack: error?.stack,
      });
      
      const errorMessage = error?.message || error?.code || error?.toString() || 'Unknown error';
      const errorDetails = error?.code ? ` (Code: ${error.code})` : '';
      const statusDetails = error?.statusCode ? ` Status: ${error.statusCode}` : '';
      
      throw new BadRequestException(
        `Failed to upload file to S3: ${errorMessage}${errorDetails}${statusDetails}. ` +
        `Please check your AWS credentials and bucket configuration.`
      );
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }
}

