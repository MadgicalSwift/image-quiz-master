




import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { UserService } from 'src/model/user.service';
import { SwiftchatMessageService } from 'src/swiftchat/swiftchat.service';
import * as quizData from 'src/config/data.json'; // Adjust the path to your JSON file

@Injectable()
export class ChatbotService {
  private readonly intentClassifier: IntentClassifier;
  private readonly message: MessageService;
  private readonly userService: UserService;
  private readonly swiftchatMessageService: SwiftchatMessageService;
  private currentQuestionIndex: { [key: string]: number } = {};
  private currentTopic: { [key: string]: string } = {};
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
    console.log("Body======", body);
    
    const userData = await this.userService.findUserByMobileNumber(from);

    if (button_response) {
      console.log("Button clicked");

      if (
        button_response.body === 'Nutrition' || 
        button_response.body === 'Healthy Habits' || 
        button_response.body === 'Good Manners' || 
        button_response.body === 'Mental Wellness' || 
        button_response.body === 'Exercise & Fitness'
      ) {
        // Start the quiz for the selected topic
        await this.swiftchatMessageService.sendQuizInstructions(from, button_response.body);
        this.currentTopic[from] = button_response.body;
        this.currentQuestionIndex[from] = 0; // Reset progress for new quiz
        this.correctAnswersCount[from] = 0; // Reset correct answers count
        await this.startQuiz(from, button_response.body);
      } else if (button_response.body === 'Yes') {
        // Send topic selection message
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else if (button_response.body === 'Start Quiz') {
        // Start quiz with the first question
        await this.startQuiz(from, userData.quizTopic);
      } else if (button_response.body === 'Next Question') {
        // Proceed to the next quiz question
        const currentIndex = this.currentQuestionIndex[from];
        const topic = this.currentTopic[from];
        const questions = this.getQuizQuestions(topic);

        if (currentIndex < questions.length) {
          await this.sendQuizQuestion(from, questions[currentIndex]);
        } else {
          const correctAnswers = this.correctAnswersCount[from] || 0;
          await this.swiftchatMessageService.sendQuizCompletionMessage(from);
          await this.swiftchatMessageService.sendQuizSummaryMessage(from, topic, correctAnswers);
        }
      } else if (button_response.body === 'Topic Selection') {
        // Go back to topic selection
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
        //console.log("koioo");
      } else if (button_response.body === 'Retake Quiz') {
        // Restart the quiz for the same topic
        const topic = this.currentTopic[from];
        this.currentQuestionIndex[from] = 0; // Reset progress for retake
        this.correctAnswersCount[from] = 0; // Reset correct answers count
        await this.startQuiz(from, topic);
      } else if (button_response.body === 'Choose Another Topic') {
        // Return to topic selection
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else {
        // Handle quiz answers
        await this.processQuizAnswer(from, button_response.body);
        //console.log("iuiuiui");
      }
    } else {
      // Process regular text message
      const { intent, entities } = this.intentClassifier.getIntent(body.text.body);

      if (userData.language === 'english' || userData.language === 'hindi') {
        await this.userService.saveUser(userData);
      }

      if (intent === 'greeting') {
        // Send welcome message on greeting intent
        await this.message.sendWelcomeMessage(from, userData.language);
        //console.log("ghhhj");
      } else if (intent === 'select_language') {
        const selectedLanguage = entities[0];
        userData.language = selectedLanguage;
        await this.userService.saveUser(userData);
        await this.message.sendLanguageChangedMessage(from, userData.language);
        //console.log("asadsd");
      }
    }

    return 'ok';
  }

  private async startQuiz(from: string, topic: string): Promise<void> {
    const questions = this.getQuizQuestions(topic);
    if (questions.length > 0) {
      await this.sendQuizQuestion(from, questions[0]);
    }
  }

  private async sendQuizQuestion(from: string, question: any): Promise<void> {
    await this.swiftchatMessageService.sendQuizQuestion(from, question);
    // Update user's quiz progress
    this.currentQuestionIndex[from] = (this.currentQuestionIndex[from] || 0) + 1;
  }

  private async processQuizAnswer(from: string, answer: string): Promise<void> {
    const topic = this.currentTopic[from];
    const questions = this.getQuizQuestions(topic);
    const currentIndex = (this.currentQuestionIndex[from] || 0) - 1;
    //console.log("ypp");

    if (currentIndex < questions.length) {
      const question = questions[currentIndex];
      const selectedOption = question.options.find(opt => opt.text === answer);
      const isCorrect = selectedOption?.isCorrect;
      const correctAnswer = question.options.find(opt => opt.isCorrect)?.text;
      const explanation = question.explanation;

      if (isCorrect) {
        this.correctAnswersCount[from] = (this.correctAnswersCount[from] || 0) + 1; 
        await this.swiftchatMessageService.sendFeedbackMessage(from, topic, currentIndex);
      } else {
        await this.swiftchatMessageService.sendIncorrectAnswerResponse(from, topic, currentIndex);
      }

      // Proceed to the next question or complete the quiz
      if (currentIndex + 1 < questions.length) {
        await this.sendQuizQuestion(from, questions[currentIndex + 1]);
      } else {
        const correctAnswers = this.correctAnswersCount[from] || 0;
        await this.swiftchatMessageService.sendQuizCompletionMessage(from);
        //console.log("hi");
        await this.swiftchatMessageService.sendQuizSummaryMessage(from, topic, correctAnswers);
      }
    }
  }

  private getQuizQuestions(topic: string): any[] {
    console.log("Fetching quiz questions for topic:", topic);
    return quizData[topic] || [];
  }
}

export default ChatbotService;
