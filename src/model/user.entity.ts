import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  quizTopic: any;
  quizProgress: number;
  currentTopic(from: any, currentTopic: any, arg2: number) {
    throw new Error('Method not implemented.');
  }
  @PrimaryGeneratedColumn()
  id: number;
  

  @Column({ unique: false })
  mobileNumber: string;

  @Column()
  language: string;
  @Column()
  botID: string;
  selectedTopic?: string;
  currentQuestion?: number;
}
