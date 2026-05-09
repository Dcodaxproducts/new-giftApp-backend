import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gift App Backend API')
    .setDescription('Gift App authentication and user account APIs')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('Customer Marketplace')
    .addTag('Customer Wishlist')
    .addTag('Customer Addresses')
    .addTag('Customer Contacts')
    .addTag('Customer Events')
    .addTag('Customer Event Reminder Settings')
    .addTag('Customer Cart')
    .addTag('Customer Orders')
    .addTag('Notifications')
    .addTag('Gift Categories')
    .addTag('Gift Management')
    .addTag('Provider Inventory')
    .addTag('Promotional Offers Management')
    .addTag('Provider Promotional Offers')
    .addTag('Payments')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    autoTagControllers: false,
  });
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  new Logger('Bootstrap').log(`Gift App API running on http://localhost:${port}`);
  new Logger('Bootstrap').log(`Swagger docs: http://localhost:${port}/docs`);
}

void bootstrap();
