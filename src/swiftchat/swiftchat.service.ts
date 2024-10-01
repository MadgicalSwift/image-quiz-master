import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { localisedStrings } from 'src/i18n/en/localised-strings'; // Adjust the path to your localizedStrings file
import * as quizData from 'src/config/edata.json'; // Adjust the path to your JSON file


dotenv.config();

@Injectable()
export class SwiftchatMessageService {
  private botId = process.env.BOT_ID;
  private apiKey = process.env.API_KEY;
  private apiUrl = process.env.API_URL;
  private baseUrl = `${this.apiUrl}/${this.botId}/messages`;

  async sendWelcomeMessage(from: string, language: string) {
    const message = localisedStrings.welcomeMessage;
    console.log(message)
    const requestData = this.prepareRequestData(from, message);
    await this.sendMessage(requestData);
    await this.sendInitialOptions(from);
  }

  async sendName(from:string){
    const message = "Can you please tell me your name?";
    const requestData = this.prepareRequestData(from, message);
    await this.sendMessage(requestData);
  }
  async sendQues(from:string, name:string){
    const message = `Thanks! Let's get started.`;
    const requestData = this.prepareRequestData(from, message);
    await this.sendMessage(requestData);
  }
  async sendInitialOptions(from: string): Promise<void> {
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: localisedStrings.chooseOption },
        },
        buttons: [
          { type: 'solid', body: 'Yes, let\'s go!', reply: 'Yes' },
          { type: 'solid', body: 'No, maybe later.', reply: 'END' },
        ],
        allow_custom_response: false,
      },
    };

    try {
      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending initial options:', error);
    }
  }

  async sendSetSelectionMessage(from: string): Promise<void> {
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: localisedStrings.chooseSet },
        },
        buttons: Array.from({ length: 10 }, (_, i) => ({
          type: 'solid',
          body: `Set ${i + 1}`,
          reply: `Set ${i + 1}`,
        })),
        allow_custom_response: false,
      },
    };

    try {
      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending set selection message:', error);
    }
  }

  async sendSelectedSetMessage(from: string, setNumber: number): Promise<void> {
    const message = `The quiz will start now.`;
    const messageData = this.prepareRequestData(from, message);
    await this.sendMessage(messageData);
  }

  async sendEndBotMessage(from: string): Promise<void> {
    const message = localisedStrings.endMessage;
    const messageData = this.prepareRequestData(from, message);
    await this.sendMessage(messageData);
  }

  public async sendHealthTips(from: string): Promise<void> {
    const healthTips = localisedStrings.healthTips;

    const tipsMessage = healthTips.join('\n');
    const messageData= this.prepareRequestData(from, tipsMessage);
    await this.sendMessage(messageData);
  }
  async sendTopicSelectionMessage(from: string) {
    const buttons = localisedStrings.topicButtons;
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: localisedStrings.chooseTopic },
        },
        buttons: [
          { type: 'solid', body: buttons.nutrition.label, reply: buttons.nutrition.reply },
          { type: 'solid', body: buttons.healthyHabits.label, reply: buttons.healthyHabits.reply },
          { type: 'solid', body: buttons.goodManners.label, reply: buttons.goodManners.reply },
          { type: 'solid', body: buttons.mentalWellness.label, reply: buttons.mentalWellness.reply },
          { type: 'solid', body: buttons.exerciseFitness.label, reply: buttons.exerciseFitness.reply }
        ],
        allow_custom_response: false,
      },
    };

    try {
      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending topic selection message:', error);
    }
  }

  async sendQuizInstructions(from: string, topic: string): Promise<void> {
    const message = localisedStrings.quizInstructions(topic);
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: message },
        },
        buttons: [{ type: 'solid', body: 'I\'m ready!', reply: 'Start Quiz' }],
        allow_custom_response: false,
      },
    };

    try {
      await this.sendMessage(messageData);

      // Randomly assign a set and start the quiz
      const quizSets = Object.keys(quizData[topic]);
      const randomSet = quizSets[Math.floor(Math.random() * quizSets.length)];
      const questions = this.getQuizQuestions(topic, randomSet);

      if (questions.length > 0) {
        await this.sendQuizQuestion(from, questions[0], topic, randomSet);
      }
    } catch (error) {
      console.error('Error sending quiz instructions message:', error);
    }
  }

  async sendQuizQuestion(from: string, question: any, topic: string, set: string): Promise<void> {
    const options = question.options.map(opt => ({
      type: 'solid',
      body: opt.text,
      reply: opt.text,
    }));

    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: question.question },
        },
        buttons: options,
        allow_custom_response: false,
      },
    };

    try {
      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending quiz question:', error);
    }
  }

  async sendFeedbackMessage(from: string, topic: string, questionIndex: number, isCorrect: boolean, explanation: string, correctAnswer: string): Promise<void> {
    const feedbackMessage = isCorrect
      ? localisedStrings.correctAnswerMessage(correctAnswer, explanation)
      : localisedStrings.incorrectAnswerMessage(correctAnswer, explanation);

    const messageData = {
      to: from,
      type: 'text',
          text: 
          { body: feedbackMessage },
    
    };

    try {
      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending feedback message:', error);
    }
  }

  async sendQuizSummaryMessage(from: string, topic: string, correctAnswersCount: number, setNumber:number, badge:string): Promise<void> {
    const totalQuestions = 10; // Assuming there are always 10 questions

    const summaryMessagePart1 = localisedStrings.quizCompletionMessagePart1(topic);
    const summaryMessagePart2 = localisedStrings.quizCompletionMessagePart2(correctAnswersCount, totalQuestions);
    const summaryMessageBadge = `Congratulations! You earned a ${badge} badge!`; // Add badge message
    // Define message data for the first part
    const messageDataPart1 = {
        to: from,
        type: 'button',
        button: {
            body: {
                type: 'text',
                text: { body: summaryMessagePart1 },
            },
            buttons: [
                { type: 'solid', body: 'OK', reply: 'ACKNOWLEDGE_PART1' }
            ],
            allow_custom_response: false,
        },
    };

    // Define message data for the second part
    const buttonsPart2 = localisedStrings.part2Buttons;
    const messageDataPart2 = {
        to: from,
        type: 'button',
        button: {
            body: {
                type: 'text',
                text: { body: `${summaryMessagePart2}\n\n${summaryMessageBadge}` },
            },
            buttons: [
              { type: 'solid', body: buttonsPart2.retakeQuiz.label, reply: buttonsPart2.retakeQuiz.reply },
              { type: 'solid', body: buttonsPart2.chooseAnotherTopic.label, reply: buttonsPart2.chooseAnotherTopic.reply },
              { type: 'solid', body: buttonsPart2.viewChallenges.label, reply: buttonsPart2.viewChallenges.reply },
              { type: 'solid', body: buttonsPart2.seeHealthTips.label, reply: buttonsPart2.seeHealthTips.reply }
            ],
            allow_custom_response: false,
        },
    };


    try {
        // Send the first part of the summary message
        await this.sendMessage(messageDataPart1);
        // Send the second part of the summary message
        await this.sendMessage(messageDataPart2);
    } catch (error) {
        console.error('Error sending quiz summary message:', error);
    }
  }

  private prepareRequestData(to: string, bodyText: string): any {
    return {
      to,
      type: 'text',
      text: { body: bodyText },
    };
  }

  public async sendMessage(requestData: any): Promise<void> {
    try {
      await axios.post(this.baseUrl, requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private getQuizQuestions(topic: string, set: string): any[] {
    return quizData[topic][set] || [];
  }
}
