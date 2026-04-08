import {
  QuizItem,
  Score,
  createInitialScore,
  isCorrectCombination,
  registerCorrectGuess,
  registerIncorrectGuess
} from "../../../domain/quiz";

export type SelectionState = {
  selectedPictureId: string | null;
  selectedNameId: string | null;
};

export type ContinuousSession = {
  score: Score;
  pictureSlots: Array<QuizItem | null>;
  nameSlots: Array<QuizItem | null>;
  remainingPool: QuizItem[];
  selection: SelectionState;
  feedback: "idle" | "correct" | "incorrect";
};

export const BATCH_SIZE = 5;
export const REPLACE_THRESHOLD = 2;

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const pickInitialBatch = (
  allItems: QuizItem[]
): { pictureSlots: Array<QuizItem | null>; nameSlots: Array<QuizItem | null>; remainingPool: QuizItem[] } => {
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  const initial = shuffled.slice(0, BATCH_SIZE);
  return {
    pictureSlots: initial,
    nameSlots: shuffle(initial),
    remainingPool: shuffled.slice(BATCH_SIZE)
  };
};

export const createContinuousSession = (allItems: QuizItem[]): ContinuousSession => {
  const { pictureSlots, nameSlots, remainingPool } = pickInitialBatch(allItems);
  return {
    score: createInitialScore(),
    pictureSlots,
    nameSlots,
    remainingPool,
    selection: {
      selectedPictureId: null,
      selectedNameId: null
    },
    feedback: "idle"
  };
};

export const selectPicture = (state: ContinuousSession, itemId: string): ContinuousSession => ({
  ...state,
  selection: {
    ...state.selection,
    selectedPictureId: itemId
  }
});

export const selectName = (state: ContinuousSession, itemId: string): ContinuousSession => ({
  ...state,
  selection: {
    ...state.selection,
    selectedNameId: itemId
  }
});

const activeCount = (state: ContinuousSession): number =>
  state.pictureSlots.filter((item) => item !== null).length;

export const shouldRefillContinuous = (state: ContinuousSession): boolean =>
  activeCount(state) <= REPLACE_THRESHOLD && state.remainingPool.length > 0;

export const refillContinuousSlots = (state: ContinuousSession): ContinuousSession => {
  const pictureEmptyIndexes = state.pictureSlots
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item === null)
    .map((entry) => entry.index);
  const nameEmptyIndexes = state.nameSlots
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item === null)
    .map((entry) => entry.index);
  const toInsert = Math.min(
    pictureEmptyIndexes.length,
    nameEmptyIndexes.length,
    state.remainingPool.length
  );
  if (toInsert === 0) {
    return state;
  }

  const replacements = state.remainingPool.slice(0, toInsert);
  const shuffledReplacements = shuffle(replacements);
  const pictureSlots = [...state.pictureSlots];
  const nameSlots = [...state.nameSlots];

  for (let index = 0; index < toInsert; index += 1) {
    pictureSlots[pictureEmptyIndexes[index]] = replacements[index];
    nameSlots[nameEmptyIndexes[index]] = shuffledReplacements[index];
  }

  return {
    ...state,
    pictureSlots,
    nameSlots,
    remainingPool: state.remainingPool.slice(toInsert)
  };
};

export const evaluateSelection = (state: ContinuousSession): ContinuousSession => {
  const picture = state.pictureSlots.find(
    (item) => item?.id === state.selection.selectedPictureId
  ) ?? null;
  const name = state.nameSlots.find((item) => item?.id === state.selection.selectedNameId) ?? null;
  const baseState = {
    ...state,
    selection: {
      selectedPictureId: null,
      selectedNameId: null
    }
  };

  if (isCorrectCombination(picture, name) && picture) {
    const pictureSlots = baseState.pictureSlots.map((item) =>
      item?.id === picture.id ? null : item
    );
    const nameSlots = baseState.nameSlots.map((item) =>
      item?.id === picture.id ? null : item
    );
    return {
      ...baseState,
      pictureSlots,
      nameSlots,
      score: registerCorrectGuess(baseState.score),
      feedback: "correct" as const
    };
  }

  return {
    ...baseState,
    score: registerIncorrectGuess(baseState.score),
    feedback: "incorrect"
  };
};
