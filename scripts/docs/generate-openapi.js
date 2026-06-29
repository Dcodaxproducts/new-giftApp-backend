require('ts-node/register');

const { RequestMethod, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const { writeFileSync } = require('fs');
const helmet = require('helmet');
const { AppModule } = require('../../src/app.module');
const { HttpExceptionFilter } = require('../../src/common/filters/http-exception.filter');
const { ResponseInterceptor } = require('../../src/common/interceptors/response.interceptor');
const { fillMissingOperationSummaries, SWAGGER_TAG_ORDER } = require('../../src/main');
const { applySwaggerAccessMetadata } = require('../../src/swagger-access');

async function main() {
  const app = await NestFactory.create(AppModule, { rawBody: true, logger: false });
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(app.get(ResponseInterceptor));
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = SWAGGER_TAG_ORDER.reduce(
    (builder, tag) => builder.addTag(tag),
    new DocumentBuilder()
      .setTitle('Gift App Backend')
      .setDescription('Complete backend API documentation for authentication, customer app flows, provider operations, admin management, payments, orders, recurring payments, transactions, notifications, storage, and audit workflows.')
      .setVersion('0.1.0')
      .addBearerAuth(),
  ).build();

  const openapiGeneratedAt = new Date().toISOString();
  const document = SwaggerModule.createDocument(app, config, { autoTagControllers: false });
  fillMissingOperationSummaries(document);
  applySwaggerAccessMetadata(document);
  document.tags = SWAGGER_TAG_ORDER.map((name) => ({ name }));
  document.info['x-openapi-generated-at'] = openapiGeneratedAt;
  writeFileSync('docs/generated/openapi.json', JSON.stringify(document, null, 2));
  await app.close();
}

void main();
