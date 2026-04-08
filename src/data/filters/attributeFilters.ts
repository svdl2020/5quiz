import { QuizItem } from "../../domain/quiz";

export type AttributeFilterSet = {
  requiredEquals?: Record<string, string | number | boolean>;
  includeAny?: Record<string, Array<string | number | boolean>>;
};

export const filterQuizItems = (
  items: QuizItem[],
  filters: AttributeFilterSet
): QuizItem[] =>
  items.filter((item) => {
    const required = filters.requiredEquals ?? {};
    const includeAny = filters.includeAny ?? {};

    for (const [key, value] of Object.entries(required)) {
      if (item.attributes[key] !== value) {
        return false;
      }
    }

    for (const [key, allowed] of Object.entries(includeAny)) {
      if (allowed.length === 0) {
        continue;
      }
      if (!allowed.includes(item.attributes[key])) {
        return false;
      }
    }

    return true;
  });
