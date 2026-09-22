import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('My Backend API')
    .setDescription(
      'Authentication and application API documentation. After /auth/login, the access token is applied automatically.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Auto-filled after login. You can also paste an access_token manually.',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true,
    },
    // Functions in swaggerOptions are stripped by JSON serialization,
    // so auto-auth is done via injected browser JS instead.
    customJsStr: `
(function () {
  function applyToken(token) {
    if (!token || !window.ui) return;
    try {
      window.ui.preauthorizeApiKey('access-token', token);
      console.log('[Swagger] access-token applied from auth response');
    } catch (err) {
      console.warn('[Swagger] Failed to apply access-token', err);
    }
  }

  function hookFetch() {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function (...args) {
      const response = await originalFetch(...args);
      try {
        const requestUrl =
          typeof args[0] === 'string'
            ? args[0]
            : args[0] && args[0].url
              ? args[0].url
              : '';
        if (requestUrl.includes('/auth/login')) {
          const data = await response.clone().json();
          const token = data && data.session && data.session.access_token;
          applyToken(token);
        }
      } catch (_) {
        // ignore non-JSON / parse errors
      }
      return response;
    };
  }

  function waitForUi(attempt) {
    if (window.ui) {
      hookFetch();
      return;
    }
    if (attempt > 50) return;
    setTimeout(function () {
      waitForUi(attempt + 1);
    }, 200);
  }

  waitForUi(0);
})();
`,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
await bootstrap();
