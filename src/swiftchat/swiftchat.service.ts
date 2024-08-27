import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { LocalizationService } from 'src/localization/localization.service';
import * as quizData from 'src/config/edata.json'; // Adjust the path to your JSON file

dotenv.config();

@Injectable()
export class SwiftchatMessageService {
  private botId = process.env.BOT_ID;
  private apiKey = process.env.API_KEY;
  private apiUrl = process.env.API_URL;
  private baseUrl = `${this.apiUrl}/${this.botId}/messages`;

  async sendWelcomeMessage(from: string, language: string) {
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(from, localisedStrings.welcomeMessage);
    await this.sendMessage(requestData);
    await this.sendInitialOptions(from);
  }

  async sendInitialOptions(from: string): Promise<void> {
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: 'Choose the option' },
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
          text: { body: 'Please choose a set number:' },
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

  async sendTopicSelectionMessage(from: string) {
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: 'Choose a topic you\'d like to explore:' },
        },
        buttons: [
          { type: 'solid', body: 'Nutrition', reply: 'Nutrition' },
          { type: 'solid', body: 'Healthy Habits', reply: 'Healthy Habits' },
          { type: 'solid', body: 'Good Manners', reply: 'Good Manners' },
          { type: 'solid', body: 'Mental Wellness', reply: 'Mental Wellness' },
          { type: 'solid', body: 'Exercise & Fitness', reply: 'Exercise & Fitness' },
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
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: `Great choice! I'll ask you 10 questions about ${topic}. After each question, I'll give you the correct answer and a short explanation. Ready?` },
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
      ? `Correct! 😄 ${correctAnswer} is the right answer. ${explanation}`
      : ` 😞 Not quite. The correct answer is ${correctAnswer}. ${explanation}`;

    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: { body: feedbackMessage },
        },
        buttons: [
          { type: 'solid', body: 'Go to topic selection', reply: 'Topic Selection' },
          { type: 'solid', body: 'Next question', reply: 'Next Question' },
        ],
        allow_custom_response: false,
      },
    };

    try {
      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending feedback message:', error);
    }
  }

  async sendQuizSummaryMessage(from: string, topic: string, correctAnswersCount: number): Promise<void> {
    const totalQuestions = 10; // Assuming there are always 10 questions

    const summaryMessagePart1 = `You're all done! 😎 Here's how you did on the ${topic} quiz:`;
    const summaryMessagePart2 = `You answered ${correctAnswersCount} out of ${totalQuestions} questions correctly!`;

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
    const messageDataPart2 = {
        to: from,
        type: 'button',
        button: {
            body: {
                type: 'text',
                text: { body: summaryMessagePart2 },
            },
            buttons: [
                { type: 'solid', body: 'Retake Quiz', reply: 'Retake Quiz' },
                { type: 'solid', body: 'Choose Another Topic', reply: 'Choose Another Topic' },
            ],
            allow_custom_response: false,
        },
    };

    try {
        // Send the first part of the message
        await this.sendMessage(messageDataPart1);
        // Send the second part of the message
        await this.sendMessage(messageDataPart2);
    } catch (error) {
        console.error('Error sending quiz summary message:', error);
    }
}


  async sendQuizCompletionMessage(from: string): Promise<void> {
    const localisedStrings = LocalizationService.getLocalisedString('en'); // Default language or fetch dynamically
    const messageData = this.prepareRequestData(from, localisedStrings.quizCompletionMessage);
    await this.sendMessage(messageData);
  }

  private prepareRequestData(to: string, message: string) {
    return {
      to,
      type: 'text',
      text: {
        body: message,
      },
    };
  }

  private async sendMessage(data: any): Promise<void> {
    try {
      await axios.post(this.baseUrl, data, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private getQuizQuestions(topic: string, setNumber: string) {
    return quizData[topic]?.[setNumber] || [];
  }
}
