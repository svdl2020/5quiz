import {
  createInitialScore,
  isCorrectCombination,
  registerCorrectGuess,
  registerIncorrectGuess
} from "./quiz";

const itemA = {
  id: "A",
  pictureUrl: "a.png",
  name: "A",
  attributes: {}
};

const itemB = {
  id: "B",
  pictureUrl: "b.png",
  name: "B",
  attributes: {}
};

describe("quiz domain score helpers", () => {
  it("creates initial score", () => {
    expect(createInitialScore()).toEqual({ correct: 0, incorrect: 0, total: 0 });
  });

  it("increments correct and total", () => {
    const result = registerCorrectGuess({ correct: 1, incorrect: 2, total: 3 });
    expect(result).toEqual({ correct: 2, incorrect: 2, total: 4 });
  });

  it("increments incorrect and total", () => {
    const result = registerIncorrectGuess({ correct: 1, incorrect: 2, total: 3 });
    expect(result).toEqual({ correct: 1, incorrect: 3, total: 4 });
  });
});

describe("combination validation", () => {
  it("accepts matching ids", () => {
    expect(isCorrectCombination(itemA, itemA)).toBe(true);
  });

  it("rejects non-matching ids", () => {
    expect(isCorrectCombination(itemA, itemB)).toBe(false);
  });
});
