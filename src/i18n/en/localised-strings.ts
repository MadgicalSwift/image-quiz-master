// src/localization/localizedStrings.ts
export const localisedStrings = {
  welcomeMessage: '🎉 Welcome to the Healthy Habits Quiz! 🌱 Pick a topic to test your knowledge and discover new tips for a healthier you. Ready to get started? 🚀',
  chooseOption: '🤔 Are you ready to start? Choose an option below to let me know! ',
  chooseSet: 'Please choose a set number:',
  chooseTopic: '🧐 What would you like to explore today? 🌈 Choose a topic below to get started!',
  quizInstructions: (topic: string) => `🎉 "Great choice! 🌟 I'm excited to ask you 10 fun questions about ${topic}! 🧠 After each question, I'll share the correct answer and a quick explanation. Are you ready? 🚀`,
  correctAnswerMessage: (correctAnswer: string, explanation: string) => `✅ Correct! 😄 ${correctAnswer} is spot on. \n\n Here's why: ${explanation}.\n\n Great job! 🌟`,
  incorrectAnswerMessage: (correctAnswer: string, explanation: string) => `😕 "Oops, not quite right. The correct answer is ${correctAnswer}. \n\n Here's why: ${explanation}.\n\n Don't worry, keep going! 💪`,
  quizCompletionMessagePart1: (topic: string) => `🎉 You're all finished! 😎 Let's see how you did on the ${topic} quiz 📝✨`,
  quizCompletionMessagePart2: (correctAnswersCount: number, totalQuestions: number) => `🎉 "You got ${correctAnswersCount} out of ${totalQuestions} questions right! Great job! 👏`,
  retakeQuiz: 'Retake Quiz',
  language_hindi: 'हिन्दी',
  validText:['hi', 'Hi', 'HI', 'hI', 'Hello', 'hello', 'hola'],
  chooseAnotherTopic: 'Choose Another Topic',
  
};
