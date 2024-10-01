import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { SwiftchatMessageService } from 'src/swiftchat/swiftchat.service';
import * as quizData from 'src/config/edata.json'; // Adjust the path to your JSON file
import { shuffleOptions } from 'src/config/shuffle-options';
import { UserService } from 'src/model/user.service';
import { MixpanelService } from 'src/mixpanel/mixpanel.service';
import { localisedStrings } from 'src/i18n/en/localised-strings';
import * as dotenv from 'dotenv';

dotenv.config();
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
    let userData = await this.userService.findUserByMobileNumber(from, botId);
    console.log(userData);
    if (!userData) {
      await this.userService.createUser(from, 'English', botId);
      userData = await this.userService.findUserByMobileNumber(from, botId);
    }
    if (button_response) {
      const response = button_response.body;
      if (response == 'Yes') {

        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button: button_response?.body,
        });

        await this.swiftchatMessageService.sendQues(from, userData.name);
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
      } else if (
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

        await this.userService.saveCurrentTopic(from, botId, response);
        await this.userService.saveCurrentSetNumber(from, botId, currentSet);
        await this.userService.saveQuestIndex(
          from,
          botId,
          currentQuestionIndex,
        );
        await this.userService.saveCurrentScore(
          from,
          botId,
          correctAnswersCount,
        );
        userData = await this.userService.findUserByMobileNumber(from, botId);
        await this.swiftchatMessageService.sendSelectedSetMessage(
          from,
          userData.setNumber,
        );
        await this.startQuiz(from, response, userData.setNumber, userData);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button: button_response?.body,
        });
      } else if (
        response === 'Choose Another Topic' ||
        response === 'Topic Selection'
      ) {
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);

        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button: button_response?.body,
        });
      } else if (response === 'See Health Tips') {
        // Call method to send health tips

        await this.swiftchatMessageService.sendHealthTips(from);
        await this.message.sendEndBotMessage(from)
        // await this.swiftchatMessageService.sendTopicSelectionMessage(from);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button: button_response?.body,
        });
      } else if (response === 'View Challenges') {
        await this.handleViewChallenges(from, userData);
        // await this.message.sendEndBotMessage(from)
        await this.swiftchatMessageService.sendTopicSelectionMessage(from);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button: button_response?.body,
        });
      } else if (response === 'Start Quiz') {
        const topic = userData.currentTopic;
        const set = userData.setNumber || 1;

        await this.startQuiz(from, topic, set, userData);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button: button_response?.body,
        });
      } else if (response === 'Next Question') {
        await this.handleNextQuestion(from, userData);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button: button_response?.body,
        });
      } else if (response === 'Retake Quiz') {
        const topic = userData.currentTopic;
        const set = userData.setNumber || 1;

        await this.userService.saveQuestIndex(from, botId, 0);
        await this.userService.saveCurrentScore(from, botId, 0);

        await this.startQuiz(from, topic, set, userData);
        this.mixpanel.track('Button_Click', {
          distinct_id: from,
          language: userData.language,
          button: button_response?.body,
        });
      } else if (response === 'END') {
        await this.message.sendEndBotMessage(from);
      } else {
        await this.processQuizAnswer(
          from,
          response,
          userData.language,
          userData,
        );
      }
    } else {
      if (localisedStrings.validText.includes(text.body)) {
        const userData = await this.userService.findUserByMobileNumber(
          from,
          botId,
        );
        if (!userData) {
          await this.userService.createUser(from, 'English', botId);
        }
        if (userData.name == null) {
          await this.message.sendWelcomeMessage(from, userData.language);
          await this.message.sendName(from);
        } else {
          await this.message.sendWelcomeMessage(from, userData.language);
          await this.message.sendTopicSelectionMessage(from);
        }
        await this.userService.saveQuestIndex(from, botId, 0);
        await this.userService.saveCurrentScore(from, botId, 0);
      } else {
        await this.userService.saveUserName(from, botId, text.body);
        await this.message.sendTopicSelectionMessage(from);
      }
    }

    return 'ok';
  }
  private async startQuiz(
    from: string,
    topic: string,
    setNumber: number,
    userData: any,
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
    userData: any,
  ): Promise<void> {
    const questions = this.getQuizQuestions(topic, setNumber);
    if (questions.length > 0) {
      await this.sendQuizQuestion(
        from,
        userData.Botid,
        questions[0],
        topic,
        setNumber,
        userData,
      );
    }
  }

  private async sendQuizQuestion(
    from: string,
    botId: string,
    question: any,
    topic: string,
    set: number,
    userData: any,
  ): Promise<void> {
    question.options = shuffleOptions(question.options);

    await this.swiftchatMessageService.sendQuizQuestion(
      from,
      question,
      topic,
      set.toString(),
    );

    await this.userService.saveQuestIndex(
      from,
      botId,
      userData.currentQuestIndex + 1,
    );
  }

  private async processQuizAnswer(
    from: string,
    answer: string,
    language: string,
    userData: any,
  ): Promise<void> {
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
        await this.userService.saveCurrentScore(
          from,
          userData.Botid,
          userData.score + 1,
        );

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

  private async handleViewChallenges(
    from: string,
    userData: any,
  ): Promise<void> {
    try {
      // Call the getTopStudents method to get the top 3 users
      const topStudents = await this.userService.getTopStudents(
        userData.Botid,
        userData.currentTopic,
        userData.setNumber,
      );
      if (topStudents.length === 0) {
        // If no top users are available, send a message saying so
        await this.swiftchatMessageService.sendMessage({
          to: from,
          type: 'text',
          text: { body: 'No challenges have been completed yet.' },
        });
        return;
      }
      // Format the response message with the top 3 students
      let message = 'Top 3 Users:\n\n';
      topStudents.forEach((student, index) => {
        const totalScore = student.score || 0;
        const studentName = student.name || 'Unknown';
        // const badge = student.challenges?.[0]?.question?.[0]?.badge || 'No badge';
        let badge = '';
        if (totalScore === 10) {
          badge = 'Gold';
        } else if (totalScore >= 7) {
          badge = 'Silver';
        } else if (totalScore >= 5) {
          badge = 'Bronze';
        } else {
          badge = 'No';
        }

        message += `${index + 1}. ${studentName}\n`;
        message += `    Score: ${totalScore}\n`;
        message += `    Badge: ${badge}\n\n`;
      });

      // Send the message with the top students' names, scores, and badges
      await this.swiftchatMessageService.sendMessage({
        to: from,
        type: 'text',
        text: { body: message },
      });
    } catch (error) {
      console.error('Error handling View Challenges:', error);
      await this.swiftchatMessageService.sendMessage({
        to: from,
        type: 'text',
        text: {
          body: 'An error occurred while fetching challenges. Please try again later.',
        },
      });
    }
  }

  private async handleNextQuestion(from: string, userData: any): Promise<void> {
    const currentIndex = userData.currentQuestIndex;
    let topic = userData.currentTopic;
    const setNumber = userData.setNumber || 1;
    const questions = this.getQuizQuestions(topic, setNumber);
    if (currentIndex < questions.length) {
      await this.sendQuizQuestion(
        from,
        userData.Botid,
        questions[currentIndex],
        topic,
        setNumber,
        userData,
      );
    } else {
      userData = await this.userService.findUserByMobileNumber(
        from,
        userData.Botid,
      );
      const correctAnswers = userData.score || 0;

      //Determine badge based on correct answers
      let badge = '';
      if (correctAnswers === 10) {
        badge = 'Gold';
      } else if (correctAnswers >= 7) {
        badge = 'Silver';
      } else if (correctAnswers >= 5) {
        badge = 'Bronze';
      } else {
        badge = 'No';
      }

      // Store the data to be stored in database
      const challengeData = {
        topic: topic,
        question: [
          {
            setNumber: setNumber,
            score: correctAnswers,
            badge: badge,
          },
        ],
      };
      // Save the challenge data into the database

      await this.userService.saveUserChallenge(
        from,
        userData.Botid,
        challengeData,
      );

      // await this.swiftchatMessageService.sendQuizCompletionMessage(from);
      await this.swiftchatMessageService.sendQuizSummaryMessage(
        from,
        topic,
        correctAnswers,
        setNumber,
        badge,
      );
      await this.userService.saveQuestIndex(from, userData.Botid, 0);
    }
  }

  private getQuizQuestions(topic: string, setNumber: number): any[] {
    return (
      quizData[topic]?.find((set) => set.set === setNumber)?.questions || []
    );
  }

  private getRandomSetNumber(topic: string): number {
    const sets = quizData[topic]?.map((set) => set.set) || [];
    // const randomSet = sets[Math.floor(Math.random() * sets.length)] || 1;
    const randomSet = 1;

    return randomSet;
  }
}
