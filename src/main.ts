import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { applySwaggerAccessMetadata } from './swagger-access';

export const SWAGGER_TAG_ORDER = [
  '01 Auth',
  '01 Auth - Login Attempts',
  '02 Admin - Staff Management',
  '02 Admin - Roles & Permissions',
  '02 Admin - User Management',
  '02 Admin - Provider Management',
  '02 Admin - Provider Business Categories',
  '02 Admin - Referral Settings',
  '02 Admin - Media Upload Policy',
  '02 Admin - Audit Logs',
  '03 Provider - Inventory',
  '03 Provider - Promotional Offers',
  '03 Provider - Orders',
  '03 Provider - Refund Requests',
  '03 Provider - Order Analytics',
  '04 Gifts - Categories',
  '04 Gifts - Management',
  '04 Gifts - Moderation',
  '05 Customer - Marketplace',
  '05 Customer - Wishlist',
  '05 Customer - Addresses',
  '05 Customer - Contacts',
  '05 Customer - Events',
  '05 Customer - Cart',
  '05 Customer - Orders',
  '05 Customer - Recurring Payments',
  '05 Customer - Transactions',
  '05 Customer - Referrals & Rewards',
  '05 Customer - Wallet',
  '05 Customer - Payment Methods',
  '06 Payments',
  '06 Notifications',
  '06 Broadcast Notifications',
  '07 Plans & Coupons',
  '07 Storage',
] as const;

function applySwaggerTags(builder: DocumentBuilder): DocumentBuilder {
  return SWAGGER_TAG_ORDER.reduce((current, tag) => current.addTag(tag), builder);
}

export function fillMissingOperationSummaries(document: OpenAPIObject): void {
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation = pathItem?.[method];
      if (operation && !operation.summary) {
        operation.summary = `${method.toUpperCase()} ${path}`;
      }
    }
  }
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
      .setTitle('Gift App Backend')
      .setDescription('Complete backend API documentation for authentication, customer app flows, provider operations, admin management, payments, orders, recurring payments, transactions, notifications, storage, and audit workflows.')
      .setVersion('0.1.0')
      .addBearerAuth(),
  ).build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    autoTagControllers: false,
  });
  fillMissingOperationSummaries(document);
  applySwaggerAccessMetadata(document);
  document.tags = SWAGGER_TAG_ORDER.map((name) => ({ name }));
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      tagsSorter: (a: string, b: string) => {
        // Keep this array local to the browser-executed function. Swagger UI serializes
        // sorter functions into swagger-ui-init.js, so referencing exported server-side
        // constants compiles to CommonJS `exports.*` and crashes in the browser.
        const tagOrder = [
          '01 Auth',
          '01 Auth - Login Attempts',
          '02 Admin - Staff Management',
          '02 Admin - Roles & Permissions',
          '02 Admin - User Management',
          '02 Admin - Provider Management',
          '02 Admin - Provider Business Categories',
          '02 Admin - Referral Settings',
          '02 Admin - Media Upload Policy',
          '02 Admin - Audit Logs',
          '03 Provider - Inventory',
          '03 Provider - Promotional Offers',
          '03 Provider - Orders',
          '03 Provider - Refund Requests',
          '03 Provider - Order Analytics',
          '04 Gifts - Categories',
          '04 Gifts - Management',
          '04 Gifts - Moderation',
          '05 Customer - Marketplace',
          '05 Customer - Wishlist',
          '05 Customer - Addresses',
          '05 Customer - Contacts',
          '05 Customer - Events',
          '05 Customer - Cart',
          '05 Customer - Orders',
          '05 Customer - Recurring Payments',
          '05 Customer - Transactions',
          '05 Customer - Referrals & Rewards',
          '05 Customer - Wallet',
          '05 Customer - Payment Methods',
          '06 Payments',
          '06 Notifications',
          '06 Broadcast Notifications',
          '07 Plans & Coupons',
          '07 Storage',
        ];
        const left = tagOrder.indexOf(a);
        const right = tagOrder.indexOf(b);
        if (left === -1 && right === -1) return a.localeCompare(b);
        if (left === -1) return 1;
        if (right === -1) return -1;
        return left - right;
      },
      operationsSorter: 'method',
    },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  new Logger('Bootstrap').log(`Gift App API running on http://localhost:${port}`);
  new Logger('Bootstrap').log(`Swagger docs: http://localhost:${port}/docs`);
}

if (require.main === module) {
  void bootstrap();
}
