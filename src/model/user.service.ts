import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  getUserAnswers(from: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async createUser(
    mobileNumber: string,
    language: string,
    botID: string,
  ): Promise<User> {
    const existingUser = await this.findUserByMobileNumber(mobileNumber);
    if (existingUser) {
      existingUser.language = language;
      return this.userRepository.save(existingUser);
    } else {
      const newUser = new User();
      newUser.mobileNumber = mobileNumber;
      newUser.language = language;
      newUser.botID = botID;
      return this.userRepository.save(newUser);
    }
  }

  async findUserByMobileNumber(
    mobileNumber: string,
  ): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { mobileNumber } });
  }

  async saveUser(user: User): Promise<User | undefined> {
    return this.userRepository.save(user);
  }
}
