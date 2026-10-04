import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { japaneseSymbols, type SymbolData } from "../data/japanese";
import HintButton from "./HintButton";
import Button from "./button";
import "../style/JapaneseGame.css";

const JapaneseGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const { group = "", script = "hiragana" } =
    (location.state as Partial<Pick<SymbolData, "group" | "script">>) ?? {};

  /* ---------------- Mobile / Keyboard ---------------- */
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  const toggleKeyboard = () => {
    setKeyboardOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => inputRef.current?.focus(), 0);
      } else {
        inputRef.current?.blur();
      }
      return next;
    });
  };

  /* ---------------- Data ---------------- */
  const filteredData = useMemo(
    () =>
      japaneseSymbols.filter(
        (item) => item.group === group && item.script === script
      ),
    [group, script]
  );

  const getRandomSymbol = useCallback(() => {
    if (!filteredData.length) return null;
    return filteredData[Math.floor(Math.random() * filteredData.length)];
  }, [filteredData]);

  /* ---------------- Game State ---------------- */
  const [currentSymbol, setCurrentSymbol] = useState<SymbolData | null>(null);
  const [inputLetters, setInputLetters] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const resetGame = useCallback(() => {
    setCurrentSymbol(getRandomSymbol());
    setInputLetters([]);
    setCurrentIndex(0);
  }, [getRandomSymbol]);

  useEffect(() => {
    if (filteredData.length) resetGame();
    else setCurrentSymbol(null);
  }, [filteredData, resetGame]);

  /* Focus only when allowed */
  useEffect(() => {
    if (!isMobile || keyboardOpen) {
      inputRef.current?.focus();
    }
  }, [currentSymbol, isMobile, keyboardOpen]);

  /* ---------------- Input Handling ---------------- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!currentSymbol) return;

    const key = e.key.toLowerCase();
    if (!/^[a-z]$/.test(key)) return;

    const expected = currentSymbol.romaji.toLowerCase();

    if (inputLetters[currentIndex] !== undefined) return;

    setInputLetters((prev) => {
      const updated = [...prev];
      updated[currentIndex] = key;
      return updated;
    });

    if (key === expected[currentIndex]) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex === expected.length) {
        setTimeout(() => {
          resetGame();
          setKeyboardOpen(false);
          inputRef.current?.blur();
        }, 800);
      }
    }

    e.preventDefault();
  };

  /* ---------------- Render ---------------- */
  if (!filteredData.length) {
    return (
      <div className="japanese-game__empty">
        <h2>No symbols found for this group and script.</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  if (!currentSymbol) {
    return (
      <p style={{ color: "#fff", textAlign: "center" }}>Loading...</p>
    );
  }

  return (
    <div className="japanese-game">
      {(!isMobile || !keyboardOpen) && (
        <h2 className="japanese-game__title">
          Script: {script} | Group: {group}
        </h2>
      )}

      <div className="japanese-game__symbol">
        {currentSymbol.symbol}
      </div>

      <input
        ref={inputRef}
        type="text"
        onKeyDown={handleKeyDown}
        className="japanese-game__input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
      />

      <div className="japanese-game__romanization">
        {currentSymbol.romaji.split("").map((letter, index) => {
          const userLetter = inputLetters[index];
          let cls = "japanese-game__letter";

          if (userLetter !== undefined) {
            cls +=
              userLetter === letter
                ? " japanese-game__letter--correct"
                : " japanese-game__letter--wrong";
          }

          return (
            <span key={index} className={cls}>
              {userLetter ?? "_"}
            </span>
          );
        })}
      </div>

      <div className="japanese-game__actions">
        <Button onClick={() => navigate(-1)}>Exit</Button>
        <HintButton hint={currentSymbol.romaji} inputRef={inputRef} />
        {isMobile && (
          <Button onClick={toggleKeyboard}>
            {keyboardOpen ? "Close Keyboard" : "Keyboard"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default JapaneseGame;