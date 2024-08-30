import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { SwiftchatMessageService } from 'src/swiftchat/swiftchat.service';
import * as quizData from 'src/config/edata.json'; // Adjust the path to your JSON file
import { shuffleOptions } from 'src/config/shuffle-options';
import { UserService } from 'src/model/user.service';
import * as dotenv from "dotenv"
dotenv.config()
@Injectable()
export class ChatbotService {
  private readonly intentClassifier: IntentClassifier;
  private readonly message: MessageService;
  private readonly userService: UserService;
  private readonly swiftchatMessageService: SwiftchatMessageService;
  private currentQuestionIndex: { [key: string]: number } = {};
  private currentTopic: { [key: string]: string } = {};
  private currentSet: { [key: string]: number } = {};
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
    console.log('processMessage: Start', body);

    const { from, text, button_response } = body;
    const botId = process.env.BOT_ID;
    const userData = await this.userService.findUserByMobileNumber(from,botId);
console.log(userData)
    if (button_response) {
      console.log('processMessage: Handling button response', button_response);
      const response = button_response.body;

      if (
        [
          'Nutrition',
          'Healthy Habits',
          'Good Manners',
          'Mental Wellness',
          'Exercise & Fitness',
        ].includes(response)
      ) {
        console.log(`processMessage: User selected topic: ${response}`);
        this.currentTopic[from] = response;
        this.currentSet[from] = this.getRandomSetNumber(response); // Assign a random set
        this.currentQuestionIndex[from] = 0;
        this.correctAnswersCount[from] = 0;

        await this.swiftchatMessageService.sendSelectedSetMessage(
          from,
          this.currentSet[from],
        );
        await this.startQuiz(from, response, this.currentSet[from]);
      } else if (response === 'Yes') {
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else if (response === 'Start Quiz') {
        const topic = this.currentTopic[from];
        const set = this.currentSet[from] || 1;
        console.log(
          `processMessage: Starting quiz for topic: ${topic}, set: ${set}`,
        );
        await this.startQuiz(from, topic, set);
      } else if (response === 'Next Question') {
        console.log('processMessage: Handling next question');
        await this.handleNextQuestion(from);
      } else if (response === 'Topic Selection') {
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else if (response === 'Retake Quiz') {
        const topic = this.currentTopic[from];
        const set = this.currentSet[from] || 1;
        console.log(
          `processMessage: Retaking quiz for topic: ${topic}, set: ${set}`,
        );
        this.currentQuestionIndex[from] = 0;
        this.correctAnswersCount[from] = 0;
        await this.startQuiz(from, topic, set);
      } else if (response === 'Choose Another Topic') {
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else {
        console.log('processMessage: Processing quiz answer');
        await this.processQuizAnswer(from, response);
      }
    } else {
      console.log('processMessage: Handling text input', text);

      const { intent, entities } = this.intentClassifier.getIntent(text.body);
      console.log('processMessage: Identified intent', intent);

      if (userData.language === 'english' || userData.language === 'hindi') {

        // await this.userService.saveUser(userData);
      }

      if (intent === 'greeting') {
        await this.userService.createUser(from,userData.language, botId)
        await this.message.sendWelcomeMessage(from, userData.language);

      } else if (intent === 'select_language') {
        const selectedLanguage = entities[0];
        userData.language = selectedLanguage;

        // await this.userService.saveUser(userData);
        await this.message.sendLanguageChangedMessage(from, userData.language);
      }
    }

    console.log('processMessage: End');
    return 'ok';
  }

  private async startQuiz(
    from: string,
    topic: string,
    setNumber: number,
  ): Promise<void> {
    console.log(
      `startQuiz: Starting quiz for topic: ${topic}, set: ${setNumber}`,
    );
    const questions = this.getQuizQuestions(topic, setNumber);
    console.log(
      `startQuiz: Retrieved ${questions.length} questions for the topic: ${topic}, set: ${setNumber}`,
    );

    if (questions.length > 0) {
      await this.swiftchatMessageService.sendQuizInstructions(from, topic);
      await this.shuffleAndSendQuestions(from, topic, setNumber);
    }
  }

  private async shuffleAndSendQuestions(
    from: string,
    topic: string,
    setNumber: number,
  ): Promise<void> {
    console.log(
      `shuffleAndSendQuestions: Shuffling and sending questions for topic: ${topic}, set: ${setNumber}`,
    );
    const questions = this.getQuizQuestions(topic, setNumber);
    if (questions.length > 0) {
      await this.sendQuizQuestion(from, questions[0], topic, setNumber);
    }
  }

  private async sendQuizQuestion(
    from: string,
    question: any,
    topic: string,
    set: number,
  ): Promise<void> {
    console.log('sendQuizQuestion: Sending quiz question', question);
    question.options = shuffleOptions(question.options);

    await this.swiftchatMessageService.sendQuizQuestion(
      from,
      question,
      topic,
      set.toString(),
    );
    this.currentQuestionIndex[from] =
      (this.currentQuestionIndex[from] || 0) + 1;
    console.log(
      `sendQuizQuestion: Updated current question index to ${this.currentQuestionIndex[from]}`,
    );
  }

  private async processQuizAnswer(from: string, answer: string): Promise<void> {
    console.log('processQuizAnswer: Processing quiz answer', answer);
    const topic = this.currentTopic[from];
    const setNumber = this.currentSet[from] || 1;
    const questions = this.getQuizQuestions(topic, setNumber);
    const currentIndex = (this.currentQuestionIndex[from] || 0) - 1;

    if (currentIndex < questions.length) {
      const question = questions[currentIndex];
      const selectedOption = question.options.find(
        (opt) => opt.text === answer,
      );
      const isCorrect = selectedOption?.isCorrect;
      const correctAnswer = question.options.find((opt) => opt.isCorrect)?.text;
      const explanation = question.explanation;

      console.log(
        'processQuizAnswer: Answer is',
        isCorrect ? 'correct' : 'incorrect',
      );

      if (isCorrect) {
        this.correctAnswersCount[from] =
          (this.correctAnswersCount[from] || 0) + 1;
        console.log(
          `processQuizAnswer: Incremented correct answers count to ${this.correctAnswersCount[from]}`,
        );
        await this.swiftchatMessageService.sendFeedbackMessage(
          from,
          topic,
          currentIndex,
          true,
          explanation,
          correctAnswer,
        );
      } else {
        await this.swiftchatMessageService.sendFeedbackMessage(
          from,
          topic,
          currentIndex,
          false,
          explanation,
          correctAnswer,
        );
      }

      await this.handleNextQuestion(from);
    }
  }

  private async handleNextQuestion(from: string): Promise<void> {
    console.log('handleNextQuestion: Handling next question for user', from);
    const currentIndex = this.currentQuestionIndex[from];
    const topic = this.currentTopic[from];
    const setNumber = this.currentSet[from] || 1;
    const questions = this.getQuizQuestions(topic, setNumber);

    if (currentIndex < questions.length) {
      await this.sendQuizQuestion(
        from,
        questions[currentIndex],
        topic,
        setNumber,
      );
    } else {
      const correctAnswers = this.correctAnswersCount[from] || 0;
      console.log(
        'handleNextQuestion: Quiz completed. Sending summary and completion message.',
      );
      await this.swiftchatMessageService.sendQuizCompletionMessage(from);
      await this.swiftchatMessageService.sendQuizSummaryMessage(
        from,
        topic,
        correctAnswers,
      );
    }
  }

  private getQuizQuestions(topic: string, setNumber: number): any[] {
    console.log(
      `getQuizQuestions: Fetching questions for topic: ${topic}, set: ${setNumber}`,
    );
    return (
      quizData[topic]?.find((set) => set.set === setNumber)?.questions || []
    );
  }

  private getRandomSetNumber(topic: string): number {
    console.log(
      `getRandomSetNumber: Selecting a random set number for topic: ${topic}`,
    );
    const sets = quizData[topic]?.map((set) => set.set) || [];
    const randomSet = sets[Math.floor(Math.random() * sets.length)] || 1;
    console.log(`getRandomSetNumber: Selected set number: ${randomSet}`);
    return randomSet;
  }
}
