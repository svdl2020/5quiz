import { QuizItem } from "../../../domain/quiz";
import { answerOnePlusFour, createOnePlusFourSession } from "./engine";

const dataset: QuizItem[] = [
  { id: "1", pictureUrl: "1.png", name: "One", attributes: {} },
  { id: "2", pictureUrl: "2.png", name: "Two", attributes: {} },
  { id: "3", pictureUrl: "3.png", name: "Three", attributes: {} },
  { id: "4", pictureUrl: "4.png", name: "Four", attributes: {} },
  { id: "5", pictureUrl: "5.png", name: "Five", attributes: {} }
];

describe("one plus four engine", () => {
  it("builds a first round", () => {
    const session = createOnePlusFourSession(dataset);
    expect(session.current).not.toBeNull();
    expect(session.current?.options.length).toBe(4);
  });

  it("updates score on answer", () => {
    const session = createOnePlusFourSession(dataset);
    if (!session.current) {
      throw new Error("expected current round");
    }
    const answered = answerOnePlusFour(session, session.current.question.id);
    expect(answered.score.correct + answered.score.incorrect).toBe(1);
  });

  it("keeps same question after wrong answer until correct", () => {
    const session = createOnePlusFourSession(dataset);
    if (!session.current) {
      throw new Error("expected current round");
    }
    const wrongOption = session.current.options.find(
      (option) => option.id !== session.current!.question.id
    )!;
    const afterWrong = answerOnePlusFour(session, wrongOption.id);
    expect(afterWrong.current?.question.id).toBe(session.current.question.id);
    expect(afterWrong.incorrectChoiceId).toBe(wrongOption.id);
    const afterCorrect = answerOnePlusFour(afterWrong, session.current.question.id);
    expect(afterCorrect.incorrectChoiceId).toBeNull();
    expect(afterCorrect.score.correct).toBe(1);
    expect(afterCorrect.current).not.toBeNull();
  });
});
