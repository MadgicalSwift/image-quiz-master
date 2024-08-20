import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class FeedbackService {
  constructor(private readonly httpService: HttpService) {}

  async sendFeedbackMessage(
    to: string,
    isCorrect: boolean,
    correctAnswer: string,
    explanation: string
  ): Promise<void> {
    const feedbackMessage = isCorrect
      ? `Correct! Oranges are packed with Vitamin C. 🍊`
      : `Not quite. The correct answer is ${correctAnswer}.`;

    const explanationMessage = `Explanation: ${explanation}`;

    const buttons = [
      { text: 'Go to topic selection' },
      { text: 'Next question' }
    ];

    const payload = {
      to,
      type: 'text',
      text: {
        body: `${feedbackMessage}\n${explanationMessage}`
      },
      buttons
    };

    try {
      await lastValueFrom(this.httpService.post('YOUR_API_URL', payload, {
        headers: {
          Authorization: `Bearer YOUR_API_KEY`,
          'Content-Type': 'application/json'
        }
      }));
      console.log('Feedback message sent successfully.');
    } catch (error) {
      console.error('Error sending feedback message:', error.message);
    }
  }
}
