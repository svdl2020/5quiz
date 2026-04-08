import {
  QuizItem,
  Score,
  createInitialScore,
  registerCorrectGuess,
  registerIncorrectGuess
} from "../../../domain/quiz";

export type OnePlusFourRound = {
  question: QuizItem;
  options: QuizItem[];
};

export type OnePlusFourSession = {
  score: Score;
  pool: QuizItem[];
  current: OnePlusFourRound | null;
  /** Last wrong option picked this round; cleared on correct or new round. */
  incorrectChoiceId: string | null;
  feedback: "idle" | "correct" | "incorrect";
};

const randomPick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const makeRound = (items: QuizItem[]): OnePlusFourRound | null => {
  if (items.length < 4) {
    return null;
  }

  const question = randomPick(items);
  const distractors = shuffle(items.filter((item) => item.id !== question.id)).slice(0, 3);
  return {
    question,
    options: shuffle([question, ...distractors])
  };
};

export const createOnePlusFourSession = (items: QuizItem[]): OnePlusFourSession => ({
  score: createInitialScore(),
  pool: items,
  current: makeRound(items),
  incorrectChoiceId: null,
  feedback: "idle"
});

export const answerOnePlusFour = (
  state: OnePlusFourSession,
  selectedId: string
): OnePlusFourSession => {
  if (!state.current) {
    return state;
  }

  const isCorrect = selectedId === state.current.question.id;
  if (isCorrect) {
    return {
      ...state,
      score: registerCorrectGuess(state.score),
      feedback: "correct",
      incorrectChoiceId: null,
      current: makeRound(state.pool)
    };
  }

  return {
    ...state,
    score: registerIncorrectGuess(state.score),
    feedback: "incorrect",
    incorrectChoiceId: selectedId,
    current: state.current
  };
};
