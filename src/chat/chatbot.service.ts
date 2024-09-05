import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { SwiftchatMessageService } from 'src/swiftchat/swiftchat.service';
import * as quizData from 'src/config/edata.json'; // Adjust the path to your JSON file
import { shuffleOptions } from 'src/config/shuffle-options';
import { UserService } from 'src/model/user.service';
import { MixpanelService } from 'src/mixpanel/mixpanel.service';
import { localisedStrings } from 'src/i18n/en/localised-strings';
import * as dotenv from "dotenv"

dotenv.config()
@Injectable()
export class ChatbotService {
  private readonly intentClassifier: IntentClassifier;
  private readonly message: MessageService;
  private readonly userService: UserService;
  private readonly swiftchatMessageService: SwiftchatMessageService;
  private readonly mixpanel: MixpanelService;

  constructor(
    intentClassifier: IntentClassifier,
    message: MessageService,
    userService: UserService,
    swiftchatMessageService: SwiftchatMessageService,
    mixpanel: MixpanelService,
  ) {
    this.intentClassifier = intentClassifier;
    this.message = message;
    this.userService = userService;
    this.swiftchatMessageService = swiftchatMessageService;
    this.mixpanel = mixpanel;
  }

  public async processMessage(body: any): Promise<any> {


    const { from, text, button_response } = body;
    const botId = process.env.BOT_ID;
    let userData = await this.userService.findUserByMobileNumber(from,botId);
    if (!userData) {
      await this.userService.createUser(from,"English", botId);
    }
console.log(userData)
    if (button_response) {
    
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
      
        let currentSet = this.getRandomSetNumber(response); // Assign a random set
        let currentQuestionIndex = 0;
        let correctAnswersCount = 0;

        await this.userService.saveCurrentTopic(from,botId, response)
        await this.userService.saveCurrentSetNumber(from,botId,currentSet)
        await this.userService.saveQuestIndex(from,botId, currentQuestionIndex)
        await this.userService.saveCurrentScore(from,botId, correctAnswersCount)
        userData = await this.userService.findUserByMobileNumber(from,botId);
        await this.swiftchatMessageService.sendSelectedSetMessage(
          from,
          userData.setNumber,
        );
        await this.startQuiz(from, response, userData.setNumber, userData);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button:button_response?.body,
        });
      } else if (response === 'Yes' || response === 'Choose Another Topic' || response === 'Topic Selection') {
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
       
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button:button_response?.body,
        });
      } else if (response === 'Start Quiz') {
        const topic = userData.currentTopic
        const set = userData.setNumber || 1;
      
        await this.startQuiz(from, topic, set, userData);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button:button_response?.body,
        });
      } else if (response === 'Next Question') {
       
        await this.handleNextQuestion(from, userData);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button:button_response?.body,
        });
      } else if (response === 'Retake Quiz') {
        const topic = userData.currentTopic;
        const set = userData.setNumber || 1;
      

        await this.userService.saveQuestIndex(from,botId,0)
        await this.userService.saveCurrentScore(from,botId,0)

        await this.startQuiz(from, topic, set, userData);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button:button_response?.body,
        });
      } else if(response === 'END'){
        await this.message.sendEndBotMessage(from)
      }
      else{
        await this.processQuizAnswer(from, response, userData.language, userData);
      }
    } else {
      
   
      if (localisedStrings.validText.includes(text.body)) {
        const userData = await this.userService.findUserByMobileNumber(from,botId);
        if (!userData) {
          await this.userService.createUser(from,"English", botId);
        }
      
        await this.message.sendWelcomeMessage(from, userData.language);
        await this.userService.saveQuestIndex(from,botId, 0)
        await this.userService.saveCurrentScore(from,botId, 0)
      } 
    }

  
    return 'ok';
  }

  private async startQuiz(
    from: string,
    topic: string,
    setNumber: number,
    userData: any
  ): Promise<void> {
  
    const questions = this.getQuizQuestions(topic, setNumber);
   

    if (questions.length > 0) {
      await this.swiftchatMessageService.sendQuizInstructions(from, topic);
      await this.shuffleAndSendQuestions(from, topic, setNumber, userData);
    }
  }

  private async shuffleAndSendQuestions(
    from: string,
    topic: string,
    setNumber: number,
    userData: any

  ): Promise<void> {
   
    const questions = this.getQuizQuestions(topic, setNumber);
    if (questions.length > 0) {
      await this.sendQuizQuestion(from,userData.Botid, questions[0], topic, setNumber, userData);
    }
  }

  private async sendQuizQuestion(
    from: string,
    botId: string,
    question: any,
    topic: string,
    set: number,
    userData: any
  ): Promise<void> {
  
    question.options = shuffleOptions(question.options);

    await this.swiftchatMessageService.sendQuizQuestion(
      from,
      question,
      topic,
      set.toString(),
    );

    await this.userService.saveQuestIndex(from,botId,userData.currentQuestIndex + 1)
    
   
  }

  private async processQuizAnswer(from: string, answer: string, language: string, userData: any): Promise<void> {
  
    const topic = userData.currentTopic;
    const setNumber = userData.setNumber || 1;
    const questions = this.getQuizQuestions(topic, setNumber);
    const currentIndex = (userData.currentQuestIndex || 0) - 1;
   
    if (currentIndex < questions.length) {
      const question = questions[currentIndex];
      const selectedOption = question.options.find(
        (opt) => opt.text === answer,
      );
      const isCorrect = selectedOption?.isCorrect;
      const correctAnswer = question.options.find((opt) => opt.isCorrect)?.text;
      const explanation = question.explanation;

    

      if (isCorrect) {
        await this.userService.saveCurrentScore(from, userData.Botid, userData.score+1)
       
        this.mixpanel.track('Taking_Quiz', {
          distinct_id: from,
          language: language,
          question: question.question,
          user_answer: answer,
          correct_answer: question.answer,
          answer_is: 'correct',
        });
        await this.swiftchatMessageService.sendFeedbackMessage(
          from,
          topic,
          currentIndex,
          true,
          explanation,
          correctAnswer,
        );
      } else {
        this.mixpanel.track('Taking_Quiz', {
          distinct_id: from,
          language: language,
          question: question.question,
          user_answer: answer,
          correct_answer: question.answer,
          answer_is: 'incorrect',
        });
        await this.swiftchatMessageService.sendFeedbackMessage(
          from,
          topic,
          currentIndex,
          false,
          explanation,
          correctAnswer,
        );
      }

      await this.handleNextQuestion(from, userData);
    }
  }

  private async handleNextQuestion(from: string, userData: any): Promise<void> {
  
    const currentIndex = userData.currentQuestIndex;
    let topic = userData.currentTopic;
    const setNumber = userData.setNumber || 1;
    const questions = this.getQuizQuestions(topic, setNumber);

    console.log(questions.length)
    if (currentIndex < questions.length) {
      await this.sendQuizQuestion(
        from,
        userData.Botid,
        questions[currentIndex],
        topic,
        setNumber,
        userData
      );
    } else {
      console.log("quiz complete")
      userData = await this.userService.findUserByMobileNumber(from,userData.Botid)
      const correctAnswers = userData.score || 0;
    
      // await this.swiftchatMessageService.sendQuizCompletionMessage(from);
      await this.swiftchatMessageService.sendQuizSummaryMessage(
        from,
        topic,
        correctAnswers,
      );
      await this.userService.saveQuestIndex(from,userData.Botid, 0)
    }
  }

  private getQuizQuestions(topic: string, setNumber: number): any[] {
   
    return (
      quizData[topic]?.find((set) => set.set === setNumber)?.questions || []
    );
  }

  private getRandomSetNumber(topic: string): number {
   
    const sets = quizData[topic]?.map((set) => set.set) || [];
    const randomSet = sets[Math.floor(Math.random() * sets.length)] || 1;
  
    return randomSet;
  }


}
