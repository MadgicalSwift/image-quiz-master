import { IsString,  IsDate, IsNumber } from 'class-validator';


export class User {
  @IsNumber()
  id: number;

  @IsString()
  mobileNumber: string;

  @IsString()
  language: string;
  
  @IsString()
  Botid: string;

  // Progress tracking fields
  @IsString()
  currentTopic: string;

  @IsNumber()
  currentQuestIndex: number;

  @IsNumber()
  setNumber: number;

  @IsNumber()
  score: number;
}