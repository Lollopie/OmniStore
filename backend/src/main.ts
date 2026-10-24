import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.enableCors({
    // FRONTEND_URL can include a path (https://florian-piel.space/omnistore) for the links in emails and
    // Stripe redirects, but a browser's Origin header never has one, so CORS compares the origin only.
    origin: new URL(process.env.FRONTEND_URL || 'http://localhost:5173').origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.set('trust proxy', 1);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
