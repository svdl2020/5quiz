import { QuizItem } from "../../domain/quiz";

const FLAGS_ENDPOINT =
  "https://restcountries.com/v3.1/all?fields=cca3,name,flags,continents,independent";

type CountryApiItem = {
  cca3: string;
  name: {
    common: string;
    official?: string;
  };
  flags: {
    png?: string;
    svg?: string;
  };
  continents?: string[];
  independent?: boolean;
};

export const mapCountryToQuizItem = (country: CountryApiItem): QuizItem | null => {
  const pictureUrl = country.flags.png ?? country.flags.svg;
  if (!country.cca3 || !country.name?.common || !pictureUrl) {
    return null;
  }

  return {
    id: country.cca3,
    pictureUrl,
    name: country.name.common,
    attributes: {
      officialName: country.name.official ?? country.name.common,
      continent: country.continents?.[0] ?? "Unknown",
      independent: country.independent ?? false
    }
  };
};

export const fetchFlagsDataset = async (): Promise<QuizItem[]> => {
  const response = await fetch(FLAGS_ENDPOINT);
  if (!response.ok) {
    throw new Error("Unable to fetch flags dataset");
  }

  const countries = (await response.json()) as CountryApiItem[];
  return countries
    .map(mapCountryToQuizItem)
    .filter((item): item is QuizItem => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name));
};
