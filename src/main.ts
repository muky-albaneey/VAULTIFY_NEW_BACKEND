import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for WebSocket connections
  app.enableCors({
    origin: configService.get('CORS_ORIGIN')?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Vaultify API')
    .setDescription('Vaultify Estate Management Platform API with WebSocket Support')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management and profiles')
    .addTag('Estates', 'Estate management')
    .addTag('Wallets', 'Wallet operations and transactions')
    .addTag('Subscriptions', 'Subscription management')
    .addTag('Access Codes', 'Visitor access codes')
    .addTag('Lost & Found', 'Lost and found items')
    .addTag('Service Directory', 'Service providers and reviews')
    .addTag('Utility Bills', 'Utility bill management')
    .addTag('Messaging', 'Real-time messaging with WebSocket support')
    .addTag('Resident ID', 'QR-based resident identification')
    .addTag('Reports', 'Issue reporting system')
    .addTag('Notifications', 'Push notifications')
    .addTag('Payments', 'Payment processing')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  console.log(`🚀 Vaultify Backend running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket Endpoint: ws://localhost:${port}/messaging`);
}

bootstrap();
