import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ProblemDetailsFilter } from './modules/shared/contracts/problem-details.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
