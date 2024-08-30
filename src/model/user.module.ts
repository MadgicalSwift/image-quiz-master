// user.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';

@Module({
  providers: [ UserService ],
  exports: [UserService], // Export the UserService to make it available for other modules
})
export class UserModule {}
