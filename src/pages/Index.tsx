import { useState, useEffect, useCallback } from "react";
import JigsawVisualization from "@/components/JigsawVisualization";
import NeuralNetworkVisualization from "@/components/NeuralNetworkVisualization";
import { motion } from "framer-motion";

// 6 puzzle features → 6 input neurons → hidden layers → 3 output classes
const FEATURE_NAMES = ["Edges", "Color", "Shape", "Texture", "Symmetry", "Frequency"];
const OUTPUT_LABELS = ["Face 👤", "Animal 🐾", "Landscape 🌄"];

const Index = () => {
  // Shared state: which puzzle slots are filled and their "activation" values
  const [slotActivations, setSlotActivations] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [triggerForward, setTriggerForward] = useState(0);

  const handlePieceSnapped = useCallback((slotIndex: number, score: number) => {
    setSlotActivations(prev => {
      const next = [...prev];
      next[slotIndex] = score;
      return next;
    });
    // Trigger a forward pass after a short delay
    setTimeout(() => setTriggerForward(t => t + 1), 200);
  }, []);

  const handleReset = useCallback(() => {
    setSlotActivations([0, 0, 0, 0, 0, 0]);
    setTriggerForward(0);
  }, []);

  const filledCount = slotActivations.filter(a => a > 0).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="mb-4 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient tracking-tight">
          How Neural Networks Think
        </h1>
        <p className="text-muted-foreground mt-1">
          Data fragments snap into pattern slots → feed a neural network → classification output
        </p>
      </header>

      {/* Flow indicator */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground bg-card/50 rounded-lg border border-border px-4 py-2.5">
          <span className={filledCount > 0 ? "text-primary font-bold" : ""}>
            🧩 Data Pieces
          </span>
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
          <span className={filledCount > 0 ? "text-primary font-bold" : ""}>
            🔲 Pattern Slots ({filledCount}/6)
          </span>
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>→</motion.span>
          <span className={filledCount > 0 ? "text-accent font-bold" : ""}>
            🧠 Neural Network
          </span>
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}>→</motion.span>
          <span className={filledCount >= 6 ? "text-success font-bold" : ""}>
            🎯 Classification
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" style={{ minHeight: "calc(100vh - 180px)" }}>
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <JigsawVisualization
            onPieceSnapped={handlePieceSnapped}
            onReset={handleReset}
            featureNames={FEATURE_NAMES}
          />
        </div>
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <NeuralNetworkVisualization
            inputActivations={slotActivations}
            triggerForward={triggerForward}
            featureNames={FEATURE_NAMES}
            outputLabels={OUTPUT_LABELS}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
