// src/localization/localizedStrings.ts
export const localisedStrings = {
  welcomeMessage: 'Welcome to the Healthy Habits Quiz! 🌱 Choose a topic to test your knowledge and learn something new. Ready to begin?',
  chooseOption: 'Choose the option',
  chooseSet: 'Please choose a set number:',
  chooseTopic: 'Choose a topic you\'d like to explore:',
  quizInstructions: (topic: string) => `Great choice! I'll ask you 10 questions about ${topic}. After each question, I'll give you the correct answer and a short explanation. Ready?`,
  correctAnswerMessage: (correctAnswer: string, explanation: string) => `Correct! 😄 ${correctAnswer} is the right answer. ${explanation}`,
  incorrectAnswerMessage: (correctAnswer: string, explanation: string) => `😞 Not quite. The correct answer is ${correctAnswer}. ${explanation}`,
  quizCompletionMessagePart1: (topic: string) => `You're all done! 😎 Here's how you did on the ${topic} quiz:`,
  quizCompletionMessagePart2: (correctAnswersCount: number, totalQuestions: number) => `You answered ${correctAnswersCount} out of ${totalQuestions} questions correctly!`,
  retakeQuiz: 'Retake Quiz',
  chooseAnotherTopic: 'Choose Another Topic',
  
};
