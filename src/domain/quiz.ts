export type AttributeValue = string | number | boolean;

export type QuizAttributes = Record<string, AttributeValue>;

export type QuizItem = {
  id: string;
  pictureUrl: string;
  name: string;
  attributes: QuizAttributes;
};

export enum QuizMode {
  FivePlusFive = "five-plus-five",
  Continuous = "continuous",
  OnePlusFour = "one-plus-four",
  Learn = "learn"
}

export type Score = {
  correct: number;
  incorrect: number;
  total: number;
};

export const createInitialScore = (): Score => ({
  correct: 0,
  incorrect: 0,
  total: 0
});

export const registerCorrectGuess = (score: Score): Score => ({
  correct: score.correct + 1,
  incorrect: score.incorrect,
  total: score.total + 1
});

export const registerIncorrectGuess = (score: Score): Score => ({
  correct: score.correct,
  incorrect: score.incorrect + 1,
  total: score.total + 1
});

export const isCorrectCombination = (
  pictureItem: QuizItem | null,
  nameItem: QuizItem | null
): boolean => {
  if (!pictureItem || !nameItem) {
    return false;
  }

  return pictureItem.id === nameItem.id;
};
