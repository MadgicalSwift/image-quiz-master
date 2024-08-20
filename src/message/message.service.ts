import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CustomException } from 'src/common/exception/custom.exception';
import { localisedStrings } from 'src/i18n/en/localised-strings';

@Injectable()
export abstract class MessageService {
  abstract sendWelcomeMessage(from: string, language: string): Promise<void>;
  abstract sendLanguageChangedMessage(from: string, language: string): Promise<void>;
  abstract sendTopicSelectionMessage(from: string): Promise<void>;
  abstract sendQuizInstructions(from: string, topic: string): Promise<void>;
  abstract sendQuizQuestion(from: string, question: any): Promise<void>;
  abstract sendIncorrectAnswerResponse(from: string, correctAnswer: string, explanation: string): Promise<void>;
  abstract sendNextQuestionPrompt(from: string): Promise<void>;
  abstract sendQuizCompletionMessage(from: string): Promise<void>;

  // sendEndInteractionMessage(from: any, language: string) {
  //   throw new Error('Method not implemented.');
  // }
  // sendTopicSelectionMessage(from: any, language: string) {
  //   throw new Error('Method not implemented.');
  // }
  async prepareWelcomeMessage() {
    return localisedStrings.welcomeMessage;
  }
  getSeeMoreButtonLabel() {
    return localisedStrings.seeMoreMessage;
  }

  async sendMessage(baseUrl: string, requestData: any, token: string) {
    
    try {
      const response = await axios.post(baseUrl, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw new CustomException(error);
    }
  }

  

}
