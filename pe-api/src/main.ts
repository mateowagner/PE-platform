// pe-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // Asegurar la existencia física de la carpeta de subidas de logos
  const uploadDir = path.join(process.cwd(), 'uploads', 'teams');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // Prefijo global para todos los endpoints
  app.setGlobalPrefix('api/v1');

  // Validación automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Ignora campos no declarados en el DTO
      forbidNonWhitelisted: true,
      transform: true, // Convierte tipos automáticamente
    }),
  );

  // Swagger — documentación automática
  const config = new DocumentBuilder()
    .setTitle('PE Platform API')
    .setDescription('Liga Pulpito Esports — API de gestión de torneos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS para el frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API corriendo en http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger en http://localhost:${port}/api/docs`);
}
void bootstrap();
