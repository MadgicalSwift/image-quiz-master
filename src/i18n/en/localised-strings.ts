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
  startQuiz:"Start Quiz",
  language_hindi: 'हिन्दी',
  validText:['hi', 'Hi', 'HI', 'hI','Hii','hii', 'Hello', 'hello', 'hola'],
  chooseAnotherTopic: 'Choose Another Topic',
  seeHealth: "See Health Tips",
  viewChallenges:"View Challenges",
  nextQues:"Next Question",
  topicSelect:"Topic Selection",
  end:"END",
  endMessage: "👋 Hey there! Whenever you're ready to continue, just type 'Hi' to start the bot again. Looking forward to helping you out! 😊",
  topics: {
    nutrition: 'Nutrition',
    healthyHabits: 'Healthy Habits',
    goodManners: 'Good Manners',
    mentalWellness: 'Mental Wellness',
    exerciseAndFitness: 'Exercise & Fitness',
  },
  healthTips: [
    "💧 Drink plenty of water to stay hydrated.",
    "🍎 Eat more fruits and vegetables.",
    "🏃‍♂️ Exercise regularly – at least 30 minutes a day.",
    "😴 Get enough sleep – aim for 7-8 hours each night.",
    "🚶‍♀️ Take short breaks and stretch if you sit for long periods."
  ],
  topicButtons: {
    nutrition: { label: 'Nutrition', reply: 'Nutrition' },
    healthyHabits: { label: 'Healthy Habits', reply: 'Healthy Habits' },
    goodManners: { label: 'Good Manners', reply: 'Good Manners' },
    mentalWellness: { label: 'Mental Wellness', reply: 'Mental Wellness' },
    exerciseFitness: { label: 'Exercise & Fitness', reply: 'Exercise & Fitness' },
  },
  part2Buttons: {
    retakeQuiz: { label: 'Retake Quiz', reply: 'Retake Quiz' },
    chooseAnotherTopic: { label: 'Choose Another Topic', reply: 'Choose Another Topic' },
    viewChallenges: { label: 'View Challenges', reply: 'View Challenges' },
    seeHealthTips: { label: 'See Health Tips', reply: 'See Health Tips' }
  }
};
