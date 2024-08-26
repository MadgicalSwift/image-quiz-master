import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { UserService } from 'src/model/user.service';
import { SwiftchatMessageService } from 'src/swiftchat/swiftchat.service';
import * as quizData from 'src/config/edata.json'; // Adjust the path to your JSON file
import { shuffleOptions } from 'src/config/shuffle-options';

@Injectable()
export class ChatbotService {
  private readonly intentClassifier: IntentClassifier;
  private readonly message: MessageService;
  private readonly userService: UserService;
  private readonly swiftchatMessageService: SwiftchatMessageService;
  private currentQuestionIndex: { [key: string]: number } = {};
  private currentTopic: { [key: string]: string } = {};
  private currentSet: { [key: string]: number } = {}; // Track current set
  private correctAnswersCount: { [key: string]: number } = {};

  constructor(
    intentClassifier: IntentClassifier,
    message: MessageService,
    userService: UserService,
    swiftchatMessageService: SwiftchatMessageService,
  ) {
    this.intentClassifier = intentClassifier;
    this.message = message;
    this.userService = userService;
    this.swiftchatMessageService = swiftchatMessageService;
  }

  public async processMessage(body: any): Promise<any> {
    const { from, text, button_response } = body;

    const userData = await this.userService.findUserByMobileNumber(from);

    if (button_response) {
      const response = button_response.body;

      if (['Nutrition', 'Healthy Habits', 'Good Manners', 'Mental Wellness', 'Exercise & Fitness'].includes(response)) {
        // Automatically assign a random set
        this.currentTopic[from] = response;
        this.currentSet[from] = this.getRandomSetNumber(response); // Assign a random set
        this.currentQuestionIndex[from] = 0;
        this.correctAnswersCount[from] = 0;

        // Notify user of the selected set and start the quiz
        await this.swiftchatMessageService.sendSelectedSetMessage(from, this.currentSet[from]);
        await this.startQuiz(from, response, this.currentSet[from]);
      } else if (response === 'Yes') {
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else if (response === 'Start Quiz') {
        const topic = this.currentTopic[from];
        const set = this.currentSet[from] || 1;
        await this.startQuiz(from, topic, set);
      } else if (response === 'Next Question') {
        await this.handleNextQuestion(from);
      } else if (response === 'Topic Selection') {
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else if (response === 'Retake Quiz') {
        const topic = this.currentTopic[from];
        const set = this.currentSet[from] || 1;
        this.currentQuestionIndex[from] = 0;
        this.correctAnswersCount[from] = 0;
        await this.startQuiz(from, topic, set);
      } else if (response === 'Choose Another Topic') {
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else {
        await this.processQuizAnswer(from, response);
      }
    } else {
      const { intent, entities } = this.intentClassifier.getIntent(text.body);

      if (userData.language === 'english' || userData.language === 'hindi') {
        await this.userService.saveUser(userData);
      }

      if (intent === 'greeting') {
        await this.message.sendWelcomeMessage(from, userData.language);
      } else if (intent === 'select_language') {
        const selectedLanguage = entities[0];
        userData.language = selectedLanguage;
        await this.userService.saveUser(userData);
        await this.message.sendLanguageChangedMessage(from, userData.language);
      }
    }

    return 'ok';
  }

  private async startQuiz(from: string, topic: string, setNumber: number): Promise<void> {
    const questions = this.getQuizQuestions(topic, setNumber);
    if (questions.length > 0) {
      await this.swiftchatMessageService.sendQuizInstructions(from, topic);
      await this.sendQuizQuestion(from, questions[0], topic, setNumber);
    }
  }

  private async sendQuizQuestion(from: string, question: any, topic: string, set: number): Promise<void> {
    // Shuffle the options before sending
    question.options = shuffleOptions(question.options);

    // Send the question with shuffled options
    await this.swiftchatMessageService.sendQuizQuestion(from, question, topic, set.toString());
    this.currentQuestionIndex[from] = (this.currentQuestionIndex[from] || 0) + 1;
  }

  private async processQuizAnswer(from: string, answer: string): Promise<void> {
    const topic = this.currentTopic[from];
    const setNumber = this.currentSet[from] || 1;
    const questions = this.getQuizQuestions(topic, setNumber);
    const currentIndex = (this.currentQuestionIndex[from] || 0) - 1;

    if (currentIndex < questions.length) {
      const question = questions[currentIndex];
      const selectedOption = question.options.find(opt => opt.text === answer);
      const isCorrect = selectedOption?.isCorrect;
      const correctAnswer = question.options.find(opt => opt.isCorrect)?.text;
      const explanation = question.explanation;

      if (isCorrect) {
        this.correctAnswersCount[from] = (this.correctAnswersCount[from] || 0) + 1;
        await this.swiftchatMessageService.sendFeedbackMessage(from, topic, currentIndex, true, explanation, correctAnswer);
      } else {
        await this.swiftchatMessageService.sendFeedbackMessage(from, topic, currentIndex, false, explanation, correctAnswer);
      }

      await this.handleNextQuestion(from);
    }
  }

  private async handleNextQuestion(from: string): Promise<void> {
    const currentIndex = this.currentQuestionIndex[from];
    const topic = this.currentTopic[from];
    const setNumber = this.currentSet[from] || 1;
    const questions = this.getQuizQuestions(topic, setNumber);

    if (currentIndex < questions.length) {
      await this.sendQuizQuestion(from, questions[currentIndex], topic, setNumber);
    } else {
      const correctAnswers = this.correctAnswersCount[from] || 0;
      await this.swiftchatMessageService.sendQuizCompletionMessage(from);
      await this.swiftchatMessageService.sendQuizSummaryMessage(from, topic, correctAnswers);
    }
  }

  private getQuizQuestions(topic: string, setNumber: number): any[] {
    return (quizData[topic]?.find(set => set.set === setNumber)?.questions) || [];
  }

  private getRandomSetNumber(topic: string): number {
    const sets = quizData[topic]?.map(set => set.set) || [];
    return sets[Math.floor(Math.random() * sets.length)] || 1;
  }
}
export default ChatbotService;
