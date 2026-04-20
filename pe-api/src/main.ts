import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todos los endpoints
  app.setGlobalPrefix('api/v1');

  // Validación automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignora campos no declarados en el DTO
      forbidNonWhitelisted: true,
      transform: true, // convierte tipos automáticamente
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
    origin: 'http://localhost:5173', // puerto de Vite
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 API corriendo en http://localhost:3000/api/v1`);
  console.log(`📚 Swagger en http://localhost:3000/api/docs`);
}
void bootstrap();
