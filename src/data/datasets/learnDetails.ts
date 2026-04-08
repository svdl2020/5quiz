import { QuizItem } from "../../domain/quiz";
import { DatasetId } from "./types";

export type LearnDetailRow = [label: string, value: string];

export const getLearnDetailRows = (
  datasetId: DatasetId,
  item: QuizItem
): LearnDetailRow[] => {
  const attrs = item.attributes;
  if (datasetId === "flags") {
    return [
      ["Official name", String(attrs.officialName ?? item.name)],
      ["Common name", item.name],
      ["Continent", String(attrs.continent ?? "Unknown")],
      [
        "Independent",
        attrs.independent === true ? "Yes" : attrs.independent === false ? "No" : "Unknown"
      ]
    ];
  }
  return [
    ["Name", item.name],
    ["Generation", String(attrs.generation ?? "Unknown")],
    ["Types", String(attrs.types ?? "Unknown")]
  ];
};
