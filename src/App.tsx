import { useEffect, useMemo, useState } from "react";
import { filterQuizItems } from "./data/filters/attributeFilters";
import {
  type ContinentKey,
  CONTINENT_OPTIONS,
  GENERATION_OPTIONS,
  type GenerationLabel,
  type DatasetId
} from "./data/datasets/types";
import {
  buildFlagsAttributeFilters,
  buildPokemonAttributeFilters
} from "./data/datasets/filters";
import { getLearnDetailRows } from "./data/datasets/learnDetails";
import { DATASETS, getDataset } from "./data/datasets/registry";
import {
  createContinuousSession,
  evaluateSelection,
  refillContinuousSlots,
  selectName,
  selectPicture,
  shouldRefillContinuous,
  type ContinuousSession
} from "./features/modes/continuous/engine";
import { QuizItem, QuizMode } from "./domain/quiz";
import {
  answerOnePlusFour,
  createOnePlusFourSession,
  type OnePlusFourSession
} from "./features/modes/onePlusFour/engine";

type LoadState = "idle" | "loading" | "error";

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const createOptions = (activeItems: QuizItem[]): QuizItem[] => shuffle(activeItems);

const loadCachedItems = (cacheKey: string): QuizItem[] | null => {
  const raw = localStorage.getItem(cacheKey);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as QuizItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

export const App = () => {
  const [activeDatasetId, setActiveDatasetId] = useState<DatasetId>("flags");
  const [allItems, setAllItems] = useState<QuizItem[]>([]);
  const [mode, setMode] = useState<QuizMode>(QuizMode.Continuous);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [datasetMenuOpen, setDatasetMenuOpen] = useState(false);
  const [continuousSession, setContinuousSession] = useState<ContinuousSession | null>(null);
  const [onePlusFourSession, setOnePlusFourSession] = useState<OnePlusFourSession | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [allContinentsSelected, setAllContinentsSelected] = useState<boolean>(true);
  const [selectedContinents, setSelectedContinents] = useState<ContinentKey[]>([
    ...CONTINENT_OPTIONS
  ]);
  const [independentOnly, setIndependentOnly] = useState<boolean>(false);
  const [allGenerationsSelected, setAllGenerationsSelected] = useState<boolean>(true);
  const [selectedGenerations, setSelectedGenerations] = useState<GenerationLabel[]>([
    ...GENERATION_OPTIONS
  ]);
  const [learnInput, setLearnInput] = useState("");
  const [learnCurrent, setLearnCurrent] = useState<QuizItem | null>(null);
  const [learnReveal, setLearnReveal] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setDatasetMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const def = getDataset(activeDatasetId);

    setLoadState("loading");
    setContinuousSession(null);
    setOnePlusFourSession(null);
    setLearnInput("");
    setLearnReveal(false);

    const cached = loadCachedItems(def.cacheKey);
    if (cached && cached.length >= 5) {
      setAllItems(cached);
      setLearnCurrent(cached[0] ?? null);
      setLoadState("idle");
    }

    const persistAndApply = (items: QuizItem[]) => {
      if (cancelled) {
        return;
      }
      if (def.id === "flags") {
        localStorage.setItem(def.cacheKey, JSON.stringify(items));
      }
      setAllItems(items);
      setLearnCurrent(items[0] ?? null);
      setLoadState("idle");
    };

    def
      .fetchItems()
      .then(persistAndApply)
      .catch(() => {
        if (!cancelled) {
          setLoadState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeDatasetId]);

  const attributeFilters = useMemo(() => {
    if (activeDatasetId === "flags") {
      return buildFlagsAttributeFilters({
        allContinentsSelected,
        selectedContinents,
        independentOnly
      });
    }
    return buildPokemonAttributeFilters({
      allGenerationsSelected,
      selectedGenerations
    });
  }, [
    activeDatasetId,
    allContinentsSelected,
    selectedContinents,
    independentOnly,
    allGenerationsSelected,
    selectedGenerations
  ]);

  const filteredItems = useMemo(
    () => filterQuizItems(allItems, attributeFilters),
    [allItems, attributeFilters]
  );

  const learnGuessCorrect =
    mode === QuizMode.Learn &&
    learnCurrent !== null &&
    learnInput.trim().toLowerCase() === learnCurrent.name.toLowerCase();
  const learnIsShowingAnswer = learnReveal || learnGuessCorrect;
  const learnDetails = useMemo(
    () => (learnCurrent ? getLearnDetailRows(activeDatasetId, learnCurrent) : []),
    [learnCurrent, activeDatasetId]
  );

  useEffect(() => {
    if (filteredItems.length >= 5) {
      setContinuousSession(createContinuousSession(filteredItems));
      setOnePlusFourSession(createOnePlusFourSession(filteredItems));
      setLearnCurrent(filteredItems[0] ?? null);
      setLearnInput("");
      setLearnReveal(false);
    }
  }, [filteredItems]);

  const onPickPicture = (itemId: string) => {
    setContinuousSession((current) => {
      if (!current) {
        return current;
      }
      const selected = selectPicture(current, itemId);
      if (!selected.selection.selectedNameId) {
        return selected;
      }
      const evaluated = evaluateSelection(selected);
      if (evaluated.feedback === "correct" && shouldRefillContinuous(evaluated)) {
        window.setTimeout(() => {
          setContinuousSession((timedState) =>
            timedState ? refillContinuousSlots(timedState) : timedState
          );
        }, 300);
      }
      return evaluated;
    });
  };

  const onPickName = (itemId: string) => {
    setContinuousSession((current) => {
      if (!current) {
        return current;
      }
      const selected = selectName(current, itemId);
      if (!selected.selection.selectedPictureId) {
        return selected;
      }
      const evaluated = evaluateSelection(selected);
      if (evaluated.feedback === "correct" && shouldRefillContinuous(evaluated)) {
        window.setTimeout(() => {
          setContinuousSession((timedState) =>
            timedState ? refillContinuousSlots(timedState) : timedState
          );
        }, 300);
      }
      return evaluated;
    });
  };

  const onAnswerOnePlusFour = (itemId: string) => {
    setOnePlusFourSession((current) => (current ? answerOnePlusFour(current, itemId) : current));
  };

  const moveLearnNext = () => {
    if (!learnCurrent || filteredItems.length === 0) {
      return;
    }
    const currentIndex = filteredItems.findIndex((item) => item.id === learnCurrent.id);
    const next = filteredItems[(currentIndex + 1) % filteredItems.length] ?? null;
    setLearnCurrent(next);
    setLearnInput("");
    setLearnReveal(false);
  };

  const onLearnShowOrNext = () => {
    if (!learnCurrent) {
      return;
    }
    if (!learnIsShowingAnswer) {
      setLearnInput(learnCurrent.name);
      setLearnReveal(true);
      return;
    }
    moveLearnNext();
  };

  const onToggleAllContinents = (checked: boolean) => {
    setAllContinentsSelected(checked);
    setSelectedContinents(checked ? [...CONTINENT_OPTIONS] : []);
  };

  const onToggleContinent = (continent: ContinentKey, checked: boolean) => {
    setAllContinentsSelected(false);
    setSelectedContinents((current) => {
      const next = checked
        ? Array.from(new Set([...current, continent]))
        : current.filter((value) => value !== continent);
      const allSelected = CONTINENT_OPTIONS.every((option) => next.includes(option));
      if (allSelected) {
        setAllContinentsSelected(true);
      }
      return allSelected ? [...CONTINENT_OPTIONS] : next;
    });
  };

  const onToggleAllGenerations = (checked: boolean) => {
    setAllGenerationsSelected(checked);
    setSelectedGenerations(checked ? [...GENERATION_OPTIONS] : []);
  };

  const onToggleGeneration = (generation: GenerationLabel, checked: boolean) => {
    setAllGenerationsSelected(false);
    setSelectedGenerations((current) => {
      const next = checked
        ? Array.from(new Set([...current, generation]))
        : current.filter((value) => value !== generation);
      const allSelected = GENERATION_OPTIONS.every((option) => next.includes(option));
      if (allSelected) {
        setAllGenerationsSelected(true);
      }
      return allSelected ? [...GENERATION_OPTIONS] : next;
    });
  };

  const activeDataset = getDataset(activeDatasetId);

  if (loadState === "loading" && !continuousSession) {
    return (
      <main className="screen">
        Loading {activeDataset.label}…
      </main>
    );
  }

  if (loadState === "error" && !continuousSession) {
    return <main className="screen">Unable to load data from public APIs.</main>;
  }

  if (!continuousSession) {
    return <main className="screen">No quiz session available.</main>;
  }

  return (
    <main className="screen">
      <header className="topbar">
        <div className="topbarLeft">
          <div className="datasetPickerWrap">
            <button
              type="button"
              className="datasetEmojiButton"
              aria-label={activeDataset.ariaLabel}
              aria-expanded={datasetMenuOpen}
              aria-haspopup="true"
              onClick={() => {
                setDatasetMenuOpen((current) => !current);
                setSettingsOpen(false);
              }}
            >
              {activeDataset.emoji}
            </button>
            {datasetMenuOpen && (
              <section className="datasetPanel" role="menu">
                {DATASETS.map((dataset) => (
                  <button
                    key={dataset.id}
                    type="button"
                    role="menuitem"
                    className={`datasetOption${
                      dataset.id === activeDatasetId ? " datasetOptionActive" : ""
                    }`}
                    onClick={() => {
                      setActiveDatasetId(dataset.id);
                      setDatasetMenuOpen(false);
                    }}
                  >
                    <span className="datasetOptionEmoji" aria-hidden>
                      {dataset.emoji}
                    </span>
                    {dataset.label}
                  </button>
                ))}
              </section>
            )}
          </div>
          <h1>5quiz</h1>
        </div>
        <div className="topbarCenter">
          <div className="settingsWrap">
            <button
              className="gearButton"
              aria-label="Open settings"
              onClick={() => {
                setSettingsOpen((current) => !current);
                setDatasetMenuOpen(false);
              }}
            >
              ⚙
            </button>
            {settingsOpen && (
              <section className="settingsPanel">
                <label>
                  Mode
                  <select value={mode} onChange={(event) => setMode(event.target.value as QuizMode)}>
                    <option value={QuizMode.Continuous}>Continuous</option>
                    <option value={QuizMode.OnePlusFour}>1+4</option>
                    <option value={QuizMode.Learn}>Learn</option>
                  </select>
                </label>

                {activeDatasetId === "flags" && (
                  <>
                    <fieldset className="settingsFieldset">
                      <legend>Continents</legend>
                      <label className="checkboxLabel">
                        <input
                          type="checkbox"
                          checked={allContinentsSelected}
                          onChange={(event) => onToggleAllContinents(event.target.checked)}
                        />
                        All
                      </label>
                      {CONTINENT_OPTIONS.map((continent) => (
                        <label key={continent} className="checkboxLabel">
                          <input
                            type="checkbox"
                            checked={selectedContinents.includes(continent)}
                            onChange={(event) => onToggleContinent(continent, event.target.checked)}
                          />
                          {continent}
                        </label>
                      ))}
                    </fieldset>

                    <label className="checkboxLabel">
                      <input
                        type="checkbox"
                        checked={independentOnly}
                        onChange={(e) => setIndependentOnly(e.target.checked)}
                      />
                      Independent only
                    </label>
                  </>
                )}

                {activeDatasetId === "pokemon" && (
                  <fieldset className="settingsFieldset">
                    <legend>Generations</legend>
                    <label className="checkboxLabel">
                      <input
                        type="checkbox"
                        checked={allGenerationsSelected}
                        onChange={(event) => onToggleAllGenerations(event.target.checked)}
                      />
                      All
                    </label>
                    {GENERATION_OPTIONS.map((generation) => (
                      <label key={generation} className="checkboxLabel">
                        <input
                          type="checkbox"
                          checked={selectedGenerations.includes(generation)}
                          onChange={(event) =>
                            onToggleGeneration(generation, event.target.checked)
                          }
                        />
                        {generation}
                      </label>
                    ))}
                  </fieldset>
                )}
              </section>
            )}
          </div>
        </div>
        <div className="topbarRight">
          {mode === QuizMode.Continuous && (
            <p className="score topbarScore" aria-live="polite">
              <span className="good">{continuousSession.score.correct}</span>{" "}
              <span className="bad">{continuousSession.score.incorrect}</span>{" "}
              <span className="datasetCount">{filteredItems.length}</span>
            </p>
          )}
          {mode === QuizMode.OnePlusFour && onePlusFourSession && (
            <p className="score topbarScore" aria-live="polite">
              <span className="good">{onePlusFourSession.score.correct}</span>{" "}
              <span className="bad">{onePlusFourSession.score.incorrect}</span>{" "}
              <span className="datasetCount">{filteredItems.length}</span>
            </p>
          )}
          {mode === QuizMode.Learn && <div className="topbarScorePlaceholder" aria-hidden />}
        </div>
      </header>

      {mode === QuizMode.Continuous && (
        <>
          <section className="rows">
            {continuousSession.pictureSlots.map((pictureItem, index) => {
              const nameItem = continuousSession.nameSlots[index] ?? null;
              return (
                <div key={`row-${index}`} className="quizRow">
                  {pictureItem ? (
                    <button
                      className={`card rowCell ${
                        continuousSession.selection.selectedPictureId === pictureItem.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => onPickPicture(pictureItem.id)}
                    >
                      <img src={pictureItem.pictureUrl} alt={pictureItem.name} />
                    </button>
                  ) : (
                    <div className="card rowCell placeholder correct" />
                  )}

                  {nameItem ? (
                    <button
                      className={`answer rowCell ${
                        continuousSession.selection.selectedNameId === nameItem.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => onPickName(nameItem.id)}
                    >
                      {nameItem.name}
                    </button>
                  ) : (
                    <div className="answer rowCell placeholder correct" />
                  )}
                </div>
              );
            })}
          </section>
          <footer className={`feedback ${continuousSession.feedback}`}>
            {continuousSession.feedback}
          </footer>
        </>
      )}

      {mode === QuizMode.OnePlusFour && onePlusFourSession?.current && (
        <>
          <section className="onePlusFourQuestion">
            <img
              src={onePlusFourSession.current.question.pictureUrl}
              alt={onePlusFourSession.current.question.name}
            />
          </section>
          <section className="answers four">
            {onePlusFourSession.current.options.map((option) => (
              <button
                key={`one4-${option.id}`}
                className={`answer ${
                  onePlusFourSession.incorrectChoiceId === option.id ? "wrongPick" : ""
                }`}
                onClick={() => onAnswerOnePlusFour(option.id)}
              >
                {option.name}
              </button>
            ))}
          </section>
          <footer className={`feedback ${onePlusFourSession.feedback}`}>
            {onePlusFourSession.feedback}
          </footer>
        </>
      )}

      {mode === QuizMode.Learn && learnCurrent && (
        <>
          <section className="onePlusFourQuestion">
            <img src={learnCurrent.pictureUrl} alt={learnCurrent.name} />
          </section>
          <section className="learnPanel">
            <div className="learnAnswerRow">
              <input
                className={`learnAnswerInput${learnGuessCorrect ? " learnAnswerCorrect" : ""}`}
                list="learnSuggestions"
                value={learnInput}
                onChange={(event) => setLearnInput(event.target.value)}
                aria-label="Your answer"
              />
              <button type="button" className="learnNextSmall" onClick={onLearnShowOrNext}>
                {learnIsShowingAnswer ? "Next" : "Show"}
              </button>
            </div>
            <datalist id="learnSuggestions">
              {filteredItems.map((item) => (
                <option key={`learn-opt-${item.id}`} value={item.name} />
              ))}
            </datalist>
            <section className="detailsList" aria-live="polite">
              {learnDetails.map(([label, value]) => (
                <div key={label} className="detailRow">
                  <span className="detailLabel">{label}:</span>
                  <span className={learnIsShowingAnswer ? "detailValue" : "detailValue hiddenValue"}>
                    {learnIsShowingAnswer ? value : "[hidden]"}
                  </span>
                </div>
              ))}
            </section>
          </section>
        </>
      )}
    </main>
  );
};
