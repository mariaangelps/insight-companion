import { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { CATEGORY_IMAGES, type CategoryImage } from "@/data/categoryImages";

interface Props {
  onImageSelected: (imageUrl: string, categoryId: string) => void;
  selectedImageUrl: string | null;
  loading: boolean;
}

// Flatten all categories into one shuffled pool, tagging each with its category
interface TaggedImage {
  url: string;
  categoryId: string;
}

export default function CategorySelector({ onImageSelected, selectedImageUrl, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Build a shuffled pool of all images from all categories
  const allImages = useMemo(() => {
    const pool: TaggedImage[] = [];
    for (const [catId, images] of Object.entries(CATEGORY_IMAGES)) {
      for (const img of images) {
        pool.push({ url: img.url, categoryId: catId });
      }
    }
    // Shuffle deterministically using a simple approach
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }, []);

  const handleImageClick = (img: TaggedImage) => {
    onImageSelected(img.url, img.categoryId);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onImageSelected(url, "custom");
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gradient mb-2">📷 Pick an Image</h2>
      <p className="text-[11px] text-muted-foreground mb-3">
        Select any image and the neural network will classify it as Face, Animal, Landscape, or Fruit.
      </p>

      <div className="grid grid-cols-4 gap-1.5 max-h-[380px] overflow-y-auto pr-1 mb-3">
        {allImages.map((img, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleImageClick(img)}
            disabled={loading}
            className={`rounded-lg overflow-hidden border-2 transition-all ${
              selectedImageUrl === img.url
                ? "border-primary glow-primary"
                : "border-border hover:border-primary/40"
            } disabled:opacity-50`}
          >
            <img
              src={img.url}
              alt={`Sample ${i + 1}`}
              className="w-full h-16 object-cover"
              loading="lazy"
            />
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="w-full p-2.5 rounded-xl border-2 border-dashed border-border bg-secondary/20 hover:border-primary/40 transition-all text-center disabled:opacity-50"
      >
        <span className="text-lg">📤</span>
        <span className="text-xs font-semibold text-foreground ml-2">Upload Your Own Image</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
