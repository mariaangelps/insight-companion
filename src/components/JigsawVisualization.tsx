import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PuzzlePiece {
  id: number;
  data: string;
  matched: boolean;
  matchScore: number;
}

interface Props {
  onPieceSnapped: (slotIndex: number, score: number) => void;
  onReset: () => void;
  featureNames: string[];
}

const DATA_LABELS = ["pixel cluster", "gradient map", "contour line", "hue histogram", "edge vector", "noise sample"];

export default function JigsawVisualization({ onPieceSnapped, onReset, featureNames }: Props) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>(
    featureNames.map((_, i) => ({ id: i, data: DATA_LABELS[i], matched: false, matchScore: 0 }))
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const [solving, setSolving] = useState(false);
  const solveRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const resetPieces = () => {
    clearTimers();
    solveRef.current = false;
    setSolving(false);
    setPieces(featureNames.map((_, i) => ({ id: i, data: DATA_LABELS[i], matched: false, matchScore: 0 })));
    setActiveIndex(-1);
    onReset();
  };

  const startSolve = () => {
    resetPieces();
    // Use setTimeout to ensure reset state is applied first
    setTimeout(() => {
      solveRef.current = true;
      setSolving(true);
      solveNext(0, featureNames.map((_, i) => ({ id: i, data: DATA_LABELS[i], matched: false, matchScore: 0 })));
    }, 50);
  };

  const solveNext = (index: number, currentPieces: PuzzlePiece[]) => {
    if (index >= currentPieces.length || !solveRef.current) {
      setSolving(false);
      solveRef.current = false;
      setActiveIndex(-1);
      return;
    }

    const score = +(0.6 + Math.random() * 0.4).toFixed(2);
    const delay = 0;

    // Phase 1: Highlight piece (testing)
    const t1 = setTimeout(() => {
      setActiveIndex(index);
    }, delay + 200);

    // Phase 2: Show match score
    const t2 = setTimeout(() => {
      setPieces(prev => prev.map((p, i) => i === index ? { ...p, matchScore: score } : p));
    }, delay + 700);

    // Phase 3: Snap into place
    const t3 = setTimeout(() => {
      setPieces(prev => prev.map((p, i) => i === index ? { ...p, matched: true, matchScore: score } : p));
      onPieceSnapped(index, score);
    }, delay + 1200);

    // Phase 4: Move to next
    const t4 = setTimeout(() => {
      setActiveIndex(-1);
      solveNext(index + 1, currentPieces);
    }, delay + 1700);

    timersRef.current.push(t1, t2, t3, t4);
  };

  useEffect(() => { return () => clearTimers(); }, []);

  const allMatched = pieces.every(p => p.matched);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gradient">🧩 Pattern Recognition</h2>
        <div className="flex gap-2">
          <button onClick={startSolve} disabled={solving}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-50">
            {allMatched ? "↻ Replay" : "▶ Solve"}
          </button>
          <button onClick={resetPieces} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-xs">
            Reset
          </button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mb-3">
        Each piece is a data feature. When it snaps into a slot, it becomes an <span className="text-primary font-semibold">input activation</span> for the neural network →
      </p>

      <div className="flex-1 grid grid-rows-[auto_1fr] gap-3 min-h-0">
        {/* Slots grid */}
        <div className="grid grid-cols-3 gap-2">
          {featureNames.map((name, i) => {
            const piece = pieces[i];
            const isActive = i === activeIndex;
            return (
              <motion.div
                key={i}
                className={`relative rounded-lg border-2 p-3 text-center transition-colors ${
                  piece.matched
                    ? "border-primary/60 bg-primary/10 glow-primary border-solid"
                    : isActive
                    ? "border-accent/60 bg-accent/5 border-dashed"
                    : "border-border bg-secondary/30 border-dashed"
                }`}
                animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ duration: 0.6, repeat: isActive ? Infinity : 0 }}
              >
                <p className="text-xs font-semibold text-foreground">{name}</p>
                {!piece.matched && <p className="text-[10px] text-muted-foreground font-mono">slot</p>}
                {piece.matched && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-0.5">
                    <p className="text-[10px] font-mono text-primary">{piece.data}</p>
                    <p className="text-[9px] text-success font-bold">✓ {piece.matchScore.toFixed(2)} → input</p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Unmatched pieces tray */}
        <div className="bg-card rounded-lg border border-border p-3">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Incoming Data Pieces</p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {pieces.filter(p => !p.matched).map((piece) => {
                const isActive = piece.id === activeIndex;
                return (
                  <motion.div
                    key={piece.id}
                    layout
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`px-3 py-2 rounded-lg border text-center ${
                      isActive ? "border-accent bg-accent/10 glow-accent" : "border-border bg-secondary"
                    }`}
                  >
                    <p className="text-[10px] font-mono text-primary font-semibold">{piece.data}</p>
                    <p className="text-[9px] text-muted-foreground">→ {featureNames[piece.id]}</p>
                    {piece.matchScore > 0 && !piece.matched && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-mono text-accent">
                        {(piece.matchScore * 100).toFixed(0)}% match
                      </motion.p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {allMatched && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-success font-semibold py-2">
                All features extracted! Neural network classifying... ✨
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
