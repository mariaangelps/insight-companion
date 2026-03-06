import { useState, useCallback } from "react";
import CategorySelector from "@/components/CategorySelector";
import ImageAnalyzer from "@/components/ImageAnalyzer";
import NeuralNetworkVisualization from "@/components/NeuralNetworkVisualization";
import { motion } from "framer-motion";

const FEATURE_NAMES = ["Edges", "Color", "Shape", "Texture", "Symmetry", "Frequency"];
const OUTPUT_LABELS = ["Face 👤", "Animal 🐾", "Landscape 🌄", "Fruit 🍎"];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState<string | undefined>(undefined);
  const [featureActivations, setFeatureActivations] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [triggerForward, setTriggerForward] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleReset = useCallback(() => {
    setSelectedCategory(null);
    setImageUrl(null);
    setImageLabel(undefined);
    setFeatureActivations([0, 0, 0, 0, 0, 0]);
    setTriggerForward(0);
  }, []);

  const handleImageSelected = useCallback((url: string, categoryId: string, label?: string) => {
    setLoading(true);
    setFeatureActivations([0, 0, 0, 0, 0, 0]);
    setSelectedCategory(categoryId);
    setImageUrl(url);
    setImageLabel(label);
    setTimeout(() => setLoading(false), 300);
  }, []);

  const handleFeaturesExtracted = useCallback((features: number[]) => {
    setFeatureActivations(features);
    setTimeout(() => setTriggerForward(t => t + 1), 200);
  }, []);

  const hasFeatures = featureActivations.some(a => a > 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="mb-4 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient tracking-tight">
          How Neural Networks Think
        </h1>
        <p className="text-muted-foreground mt-1">
          Select a category → image loads automatically → features extracted → neural network classifies
        </p>
      </header>

      {/* Flow indicator */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground bg-card/50 rounded-lg border border-border px-4 py-2.5">
          <span className={selectedCategory ? "text-primary font-bold" : ""}>
            📷 Category
          </span>
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
          <span className={imageUrl ? "text-primary font-bold" : ""}>
            🖼️ Image
          </span>
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>→</motion.span>
          <span className={hasFeatures ? "text-primary font-bold" : ""}>
            🔬 Features
          </span>
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>→</motion.span>
          <span className={hasFeatures ? "text-accent font-bold" : ""}>
            🧠 Network
          </span>
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}>→</motion.span>
          <span className={triggerForward > 0 ? "text-[hsl(var(--success))] font-bold" : ""}>
            🎯 Result
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" style={{ minHeight: "calc(100vh - 180px)" }}>
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <CategorySelector
            onImageSelected={handleImageSelected}
            selectedCategory={selectedCategory}
            loading={loading}
          />
          {imageUrl && selectedCategory && (
            <ImageAnalyzer
              imageUrl={imageUrl}
              categoryId={selectedCategory}
              onFeaturesExtracted={handleFeaturesExtracted}
              onReset={handleReset}
            />
          )}
        </div>
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <NeuralNetworkVisualization
            inputActivations={featureActivations}
            triggerForward={triggerForward}
            featureNames={FEATURE_NAMES}
            outputLabels={OUTPUT_LABELS}
            categoryId={selectedCategory}
            imageLabel={imageLabel}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
