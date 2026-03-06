import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const FEATURE_NAMES = ["Edges", "Color", "Shape", "Texture", "Symmetry", "Frequency"];

// Category-specific feature biases for realistic extraction
const CATEGORY_BIASES: Record<string, number[]> = {
  face:      [0.9, 0.6, 0.95, 0.5, 0.92, 0.4],
  animal:    [0.7, 0.8, 0.65, 0.85, 0.5, 0.6],
  landscape: [0.5, 0.9, 0.4, 0.7, 0.6, 0.8],
  fruit:     [0.6, 0.95, 0.85, 0.75, 0.8, 0.3],
  emotion:   [0.85, 0.5, 0.9, 0.45, 0.88, 0.35],
  text:      [0.95, 0.3, 0.7, 0.4, 0.6, 0.9],
  custom:    [0.7, 0.7, 0.7, 0.7, 0.7, 0.7],
};

interface Props {
  imageUrl: string;
  categoryId: string;
  onFeaturesExtracted: (features: number[]) => void;
}

export default function ImageAnalyzer({ imageUrl, categoryId, onFeaturesExtracted }: Props) {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(-1);
  const [features, setFeatures] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    // Auto-scan when image loads
    setScanning(false);
    setScanProgress(-1);
    setFeatures([]);
    setDone(false);
    clearTimers();

    const t = setTimeout(() => startScan(), 500);
    timersRef.current.push(t);
    return () => clearTimers();
  }, [imageUrl, categoryId]);

  const startScan = () => {
    setScanning(true);
    setScanProgress(0);
    setFeatures([]);
    setDone(false);

    const biases = CATEGORY_BIASES[categoryId] || CATEGORY_BIASES.custom;

    const extractNext = (i: number) => {
      if (i >= FEATURE_NAMES.length) {
        setScanning(false);
        setDone(true);
        return;
      }
      setScanProgress(i);
      const t = setTimeout(() => {
        const score = Math.max(0.1, Math.min(1, biases[i] + (Math.random() * 0.2 - 0.1)));
        setFeatures(prev => {
          const next = [...prev, +score.toFixed(2)];
          if (next.length === FEATURE_NAMES.length) {
            setTimeout(() => onFeaturesExtracted(next), 100);
          }
          return next;
        });
        extractNext(i + 1);
      }, 400);
      timersRef.current.push(t);
    };

    extractNext(0);
  };

  return (
    <div className="mt-4">
      <div className="relative rounded-xl overflow-hidden border border-border mb-4">
        <img
          src={imageUrl}
          alt="Selected for analysis"
          className="w-full h-48 object-cover"
          crossOrigin="anonymous"
        />
        {scanning && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent"
            initial={{ y: "-100%" }}
            animate={{ y: ["−100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="h-1 bg-primary/80 w-full" />
          </motion.div>
        )}
        {done && (
          <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-md">
            ✓ Analysis Complete
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {FEATURE_NAMES.map((name, i) => {
          const extracted = features[i] !== undefined;
          const isActive = scanning && scanProgress === i;
          return (
            <motion.div
              key={name}
              className={`rounded-lg border p-2 text-center transition-all ${
                extracted
                  ? "border-primary/60 bg-primary/10"
                  : isActive
                  ? "border-accent/60 bg-accent/5 animate-pulse"
                  : "border-border bg-secondary/30"
              }`}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
            >
              <p className="text-[10px] font-semibold text-foreground">{name}</p>
              {extracted ? (
                <p className="text-xs font-mono text-primary font-bold">{features[i].toFixed(2)}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">—</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
