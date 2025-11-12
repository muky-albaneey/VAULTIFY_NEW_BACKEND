import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    const emailConfig = this.configService.get('app.email');
    
    // Create transporter for Google Workspace/Gmail
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host, // smtp.gmail.com
      port: emailConfig.port, // 587 for TLS, 465 for SSL
      secure: emailConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass, // App Password for Google Workspace
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
      // Connection pool
      pool: true,
      // Keep connections alive
      maxConnections: 1,
      maxMessages: 3,
    });

    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('Email service: Successfully connected to Google Workspace SMTP');
    } catch (error) {
      console.error('Email service: Failed to connect to SMTP server:', error.message);
      console.error('Please check your SMTP configuration in .env file');
    }
  }

  async sendOTP(email: string, name: string, otp: string): Promise<void> {
    const mailOptions = {
      from: `"${this.configService.get('app.appName')}" <${this.configService.get('app.email.user')}>`,
      to: email,
      subject: 'Verify Your Email - Vaultify',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
              }
              .header {
                background-color: #2c3e50;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
              }
              .content {
                background-color: white;
                padding: 30px;
                border-radius: 0 0 5px 5px;
              }
              .otp-code {
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                color: #2c3e50;
                background-color: #ecf0f1;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
                letter-spacing: 5px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                color: #7f8c8d;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Vaultify!</h1>
              </div>
              <div class="content">
                <h2>Hello ${name},</h2>
                <p>Thank you for registering with Vaultify. Please use the code below to verify your email address:</p>
                
                <div class="otp-code">${otp}</div>
                
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account with Vaultify, please ignore this email.</p>
                
                <p>Best regards,<br>The Vaultify Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Vaultify. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to Vaultify!
        
        Hello ${name},
        
        Thank you for registering with Vaultify. Please use the code below to verify your email address:
        
        ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't create an account with Vaultify, please ignore this email.
        
        Best regards,
        The Vaultify Team
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully:', info.messageId);
      console.log('📧 Email sent to:', email);
    } catch (error) {
      console.error('❌ Error sending OTP email:', error.message);
      console.error('📧 Email details:', { to: email, subject: mailOptions.subject });
      
      // Provide helpful error messages for common issues
      if (error.message.includes('Application-specific password required') || 
          error.message.includes('Invalid login')) {
        console.error('⚠️  SMTP Authentication Error:');
        console.error('   → Gmail requires an App Password (not your regular password)');
        console.error('   → Generate one at: https://myaccount.google.com/apppasswords');
        console.error('   → Update SMTP_PASS in your .env file with the 16-digit App Password');
      } else if (error.message.includes('Connection timeout') || error.message.includes('ECONNREFUSED')) {
        console.error('⚠️  SMTP Connection Error:');
        console.error('   → Check your internet connection');
        console.error('   → Verify SMTP_HOST and SMTP_PORT in .env file');
      }
      
      // Don't throw error to avoid breaking the registration flow
      // In production, you might want to log this to a monitoring service
    }
  }

  async sendPasswordResetOTP(email: string, name: string, otp: string): Promise<void> {
    const mailOptions = {
      from: `"${this.configService.get('app.appName')}" <${this.configService.get('app.email.user')}>`,
      to: email,
      subject: 'Password Reset - Vaultify',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
              }
              .header {
                background-color: #e74c3c;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
              }
              .content {
                background-color: white;
                padding: 30px;
                border-radius: 0 0 5px 5px;
              }
              .otp-code {
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                color: #e74c3c;
                background-color: #ecf0f1;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
                letter-spacing: 5px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                color: #7f8c8d;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <h2>Hello ${name},</h2>
                <p>We received a request to reset your password. Please use the code below to reset your password:</p>
                
                <div class="otp-code">${otp}</div>
                
                <p>This code will expire in 10 minutes.</p>
                <p><strong>If you didn't request a password reset, please ignore this email.</strong></p>
                
                <p>Best regards,<br>The Vaultify Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Vaultify. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${name},
        
        We received a request to reset your password. Please use the code below to reset your password:
        
        ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request a password reset, please ignore this email.
        
        Best regards,
        The Vaultify Team
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset OTP email sent successfully:', info.messageId);
      console.log('📧 Email sent to:', email);
    } catch (error) {
      console.error('❌ Error sending password reset OTP email:', error.message);
      console.error('📧 Email details:', { to: email, subject: mailOptions.subject });
      
      // Provide helpful error messages for common issues
      if (error.message.includes('Application-specific password required') || 
          error.message.includes('Invalid login')) {
        console.error('⚠️  SMTP Authentication Error:');
        console.error('   → Gmail requires an App Password (not your regular password)');
        console.error('   → Generate one at: https://myaccount.google.com/apppasswords');
        console.error('   → Update SMTP_PASS in your .env file with the 16-digit App Password');
      }
      
      // Don't throw error to avoid breaking the flow
    }
  }
}

