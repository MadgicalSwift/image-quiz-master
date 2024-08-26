import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingService } from './common/middleware/logger.middleware';
import axios from 'axios';

axios.defaults.timeout = 10000; // 10 seconds
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
}
bootstrap();
