import 'reflect-metadata';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initSentry, isSentryEnabled } from './audit/sentry';

async function bootstrap() {
  initSentry();
  const app = await NestFactory.create(AppModule);
  if (isSentryEnabled()) {
    Logger.log('Sentry enabled', 'Bootstrap');
  }

  app.use(
    helmet({
      // Swagger UI inlines styles/scripts; relax CSP for /api/docs only.
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Reveil API')
    .setDescription('AI-powered adaptive habit transformation backend.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Reveil backend listening on http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
