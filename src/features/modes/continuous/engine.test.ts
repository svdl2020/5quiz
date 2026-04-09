import {
  createContinuousSession,
  evaluateSelection,
  refillContinuousSlots,
  selectName,
  selectPicture,
  shouldRefillContinuous
} from "./engine";
import { QuizItem } from "../../../domain/quiz";

const dataset: QuizItem[] = [
  { id: "1", pictureUrl: "1.png", name: "One", attributes: {} },
  { id: "2", pictureUrl: "2.png", name: "Two", attributes: {} },
  { id: "3", pictureUrl: "3.png", name: "Three", attributes: {} },
  { id: "4", pictureUrl: "4.png", name: "Four", attributes: {} },
  { id: "5", pictureUrl: "5.png", name: "Five", attributes: {} },
  { id: "6", pictureUrl: "6.png", name: "Six", attributes: {} },
  { id: "7", pictureUrl: "7.png", name: "Seven", attributes: {} }
];

describe("continuous engine", () => {
  it("starts with up to five active items", () => {
    const state = createContinuousSession(dataset);
    expect(state.pictureSlots.length).toBe(5);
    expect(state.nameSlots.length).toBe(5);
  });

  it("handles correct match by incrementing score", () => {
    const initial = createContinuousSession(dataset);
    const target = initial.pictureSlots.find((item): item is QuizItem => item !== null)!;
    const withPicture = selectPicture(initial, target.id);
    const withSelection = selectName(withPicture, target.id);
    const evaluated = evaluateSelection(withSelection);

    expect(evaluated.score.correct).toBe(1);
    expect(evaluated.score.total).toBe(1);
    expect(evaluated.pictureSlots.filter((item) => item === null).length).toBe(1);
  });

  it("handles incorrect match by incrementing incorrect score", () => {
    const initial = createContinuousSession(dataset);
    const ids = initial.pictureSlots
      .filter((item): item is QuizItem => item !== null)
      .map((item) => item.id);
    const withPicture = selectPicture(initial, ids[0]);
    const withSelection = selectName(withPicture, ids[1]);
    const evaluated = evaluateSelection(withSelection);

    expect(evaluated.score.incorrect).toBe(1);
    expect(evaluated.score.total).toBe(1);
  });

  it("refills only empty slots when threshold reached", () => {
    let state = createContinuousSession(dataset);
    const ids = state.pictureSlots
      .filter((item): item is QuizItem => item !== null)
      .slice(0, 3)
      .map((item) => item.id);

    for (const id of ids) {
      state = evaluateSelection(selectName(selectPicture(state, id), id));
    }

    expect(shouldRefillContinuous(state)).toBe(true);
    const activeBeforeRefill = state.pictureSlots.filter((item) => item !== null).length;
    const expectedActiveAfterRefill = Math.min(5, activeBeforeRefill + state.remainingPool.length);
    const refilled = refillContinuousSlots(state);
    expect(refilled.pictureSlots.filter((item) => item !== null).length).toBe(expectedActiveAfterRefill);
  });
});
