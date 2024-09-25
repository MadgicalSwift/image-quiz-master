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
  name:string;             //Add the name field

  @IsString()
  isNameRequired:true;

  @IsString()
  currentTopic: string;

  @IsNumber()
  currentQuestIndex: number;

  @IsNumber()
  setNumber: number;

  @IsNumber()
  score: number;

  challenges:Challenge[];

  totalScore?:number;
}
export class Challenge{
  @IsString()
  topic:string;

  question:Question[];
}

export class Question{
  @IsNumber()
  setnumber:number;

  @IsNumber()
  score:number;
  
  @IsString()
  badge:string;
}