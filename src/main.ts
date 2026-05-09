import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

export const SWAGGER_TAG_ORDER = [
  'Auth',
  'Login Attempts',
  'Admin Staff Management',
  'Admin Roles / RBAC',
  'User Management',
  'Provider Management',
  'Provider Inventory',
  'Provider Promotional Offers',
  'Promotional Offers Management',
  'Gift Categories',
  'Gift Management',
  'Gift Moderation',
  'Customer Marketplace',
  'Customer Wishlist',
  'Customer Addresses',
  'Customer Contacts',
  'Customer Events',
  'Customer Event Reminder Settings',
  'Customer Cart',
  'Customer Orders',
  'Customer Recurring Payments',
  'Customer Transactions',
  'Payments',
  'Notifications',
  'Broadcast Notifications',
  'Subscription Plans',
  'Coupons',
  'Storage',
  'Audit Logs',
] as const;

function applySwaggerTags(builder: DocumentBuilder): DocumentBuilder {
  return SWAGGER_TAG_ORDER.reduce((current, tag) => current.addTag(tag), builder);
}

function swaggerTagIndex(tag: string): number {
  const index = (SWAGGER_TAG_ORDER as readonly string[]).indexOf(tag);
  return index === -1 ? SWAGGER_TAG_ORDER.length : index;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });
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

  const swaggerConfig = applySwaggerTags(
    new DocumentBuilder()
      .setTitle('Gift App Backend API')
      .setDescription('Gift App authentication and user account APIs')
      .setVersion('0.1.0')
      .addBearerAuth(),
  ).build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    autoTagControllers: false,
  });
  document.tags = SWAGGER_TAG_ORDER.map((name) => ({ name }));
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      tagsSorter: (a: string, b: string) => swaggerTagIndex(a) - swaggerTagIndex(b),
    },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  new Logger('Bootstrap').log(`Gift App API running on http://localhost:${port}`);
  new Logger('Bootstrap').log(`Swagger docs: http://localhost:${port}/docs`);
}

void bootstrap();
