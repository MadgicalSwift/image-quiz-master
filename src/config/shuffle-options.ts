// shuffle-options.ts
export function shuffleOptions(options: { text: string; isCorrect: boolean }[]): { text: string; isCorrect: boolean }[] {
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }
  