import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import axios from 'axios';

axios.defaults.timeout = 10000; // 10 seconds
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/health-awarness/v1');
  await app.listen(3000);
}
bootstrap();
