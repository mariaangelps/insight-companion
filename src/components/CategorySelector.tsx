import { useState, useRef } from "react";
import { motion } from "framer-motion";

export interface Category {
  id: string;
  label: string;
  emoji: string;
  query: string;
}

const CATEGORIES: Category[] = [
  { id: "face", label: "Faces", emoji: "👤", query: "human face portrait" },
  { id: "animal", label: "Animals", emoji: "🐾", query: "wild animal nature" },
  { id: "landscape", label: "Landscapes", emoji: "🌄", query: "beautiful landscape scenery" },
  { id: "fruit", label: "Fruits", emoji: "🍎", query: "fresh fruit closeup" },
  { id: "emotion", label: "Emotions", emoji: "😊", query: "human emotion expression" },
  { id: "text", label: "Text", emoji: "📝", query: "text typography writing" },
];

interface Props {
  onImageSelected: (imageUrl: string, categoryId: string) => void;
  selectedCategory: string | null;
  loading: boolean;
}

export default function CategorySelector({ onImageSelected, selectedCategory, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCategory = (cat: Category) => {
    // Load random image from picsum (reliable, no API key needed)
    const seed = `${cat.id}-${Date.now()}`;
    const url = `https://picsum.photos/seed/${seed}/400/300`;
    onImageSelected(url, cat.id);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onImageSelected(url, "custom");
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gradient mb-2">📷 Select a Category</h2>
      <p className="text-[11px] text-muted-foreground mb-4">
        Choose a category to load a sample image, or upload your own. The neural network will analyze and classify it.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleCategory(cat)}
            disabled={loading}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              selectedCategory === cat.id
                ? "border-primary bg-primary/10 glow-primary"
                : "border-border bg-secondary/30 hover:border-primary/40"
            } disabled:opacity-50`}
          >
            <span className="text-2xl block mb-1">{cat.emoji}</span>
            <span className="text-xs font-semibold text-foreground">{cat.label}</span>
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="w-full p-3 rounded-xl border-2 border-dashed border-border bg-secondary/20 hover:border-primary/40 transition-all text-center disabled:opacity-50"
      >
        <span className="text-lg">📤</span>
        <span className="text-xs font-semibold text-foreground ml-2">Upload Your Own Image</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
