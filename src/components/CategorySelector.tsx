import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_IMAGES } from "@/data/categoryImages";

export interface Category {
  id: string;
  label: string;
  emoji: string;
}

const CATEGORIES: Category[] = [
  { id: "face", label: "Faces", emoji: "👤" },
  { id: "animal", label: "Animals", emoji: "🐾" },
  { id: "landscape", label: "Landscapes", emoji: "🌄" },
  { id: "fruit", label: "Fruits", emoji: "🍎" },
  { id: "text", label: "Text", emoji: "📝" },
];

interface Props {
  onImageSelected: (imageUrl: string, categoryId: string) => void;
  selectedCategory: string | null;
  loading: boolean;
}

export default function CategorySelector({ onImageSelected, selectedCategory, loading }: Props) {
  const [browsingCategory, setBrowsingCategory] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCategoryClick = (cat: Category) => {
    setBrowsingCategory(cat.id);
    setSelectedImageUrl(null);
  };

  const handleImageClick = (url: string) => {
    setSelectedImageUrl(url);
    onImageSelected(url, browsingCategory!);
  };

  const handleBack = () => {
    setBrowsingCategory(null);
    setSelectedImageUrl(null);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBrowsingCategory(null);
    onImageSelected(url, "custom");
  };

  const browsingCat = CATEGORIES.find(c => c.id === browsingCategory);
  const images = browsingCategory ? CATEGORY_IMAGES[browsingCategory] || [] : [];

  return (
    <div>
      <h2 className="text-lg font-bold text-gradient mb-2">📷 Select a Category</h2>
      <p className="text-[11px] text-muted-foreground mb-4">
        Choose a category, then pick an image from the library. Or upload your own.
      </p>

      <AnimatePresence mode="wait">
        {!browsingCategory ? (
          <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCategoryClick(cat)}
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
          </motion.div>
        ) : (
          <motion.div key="library" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button
              onClick={handleBack}
              className="mb-3 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              ← Back to categories
            </button>

            <p className="text-sm font-semibold text-foreground mb-3">
              {browsingCat?.emoji} {browsingCat?.label} — Pick an image:
            </p>

            <div className="grid grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {images.map((url, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleImageClick(url)}
                  className={`rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImageUrl === url
                      ? "border-primary glow-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <img
                    src={url}
                    alt={`${browsingCat?.label} sample ${i + 1}`}
                    className="w-full h-20 object-cover"
                    loading="lazy"
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
