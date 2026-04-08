import { QuizItem } from "../../domain/quiz";
import { filterQuizItems } from "./attributeFilters";

const items: QuizItem[] = [
  {
    id: "NL",
    pictureUrl: "nl.png",
    name: "Netherlands",
    attributes: { continent: "Europe", independent: true }
  },
  {
    id: "ZA",
    pictureUrl: "za.png",
    name: "South Africa",
    attributes: { continent: "Africa", independent: true }
  },
  {
    id: "GF",
    pictureUrl: "gf.png",
    name: "French Guiana",
    attributes: { continent: "South America", independent: false }
  }
];

describe("attribute filtering", () => {
  it("supports required equals filter", () => {
    const filtered = filterQuizItems(items, {
      requiredEquals: { independent: true }
    });

    expect(filtered.map((item) => item.id)).toEqual(["NL", "ZA"]);
  });

  it("supports includeAny filter list", () => {
    const filtered = filterQuizItems(items, {
      includeAny: { continent: ["Africa", "Europe"] }
    });

    expect(filtered.map((item) => item.id)).toEqual(["NL", "ZA"]);
  });
});
