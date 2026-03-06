import { useState, useRef } from "react";
import { motion } from "framer-motion";

export interface Category {
  id: string;
  label: string;
  emoji: string;
  query: string;
}

// Curated real image URLs per category
const CATEGORY_IMAGES: Record<string, string[]> = {
  face: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=300&fit=crop&crop=face",
  ],
  animal: [
    "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=400&h=300&fit=crop",
  ],
  landscape: [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop",
  ],
  fruit: [
    "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1568702846914-96b305d2uj68?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1528825871115-3581a5e31ab3?w=400&h=300&fit=crop",
  ],
  emotion: [
    "https://images.unsplash.com/photo-1492681290082-e932832941e6?w=400&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=400&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1508474722893-c3ccb8918d39?w=400&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=400&h=300&fit=crop&crop=face",
  ],
  text: [
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1473186505569-9c61870c11f9?w=400&h=300&fit=crop",
  ],
};

const CATEGORIES: Category[] = [
  { id: "face", label: "Faces", emoji: "👤", query: "" },
  { id: "animal", label: "Animals", emoji: "🐾", query: "" },
  { id: "landscape", label: "Landscapes", emoji: "🌄", query: "" },
  { id: "fruit", label: "Fruits", emoji: "🍎", query: "" },
  { id: "emotion", label: "Emotions", emoji: "😊", query: "" },
  { id: "text", label: "Text", emoji: "📝", query: "" },
];

interface Props {
  onImageSelected: (imageUrl: string, categoryId: string) => void;
  selectedCategory: string | null;
  loading: boolean;
}

export default function CategorySelector({ onImageSelected, selectedCategory, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCategory = (cat: Category) => {
    const images = CATEGORY_IMAGES[cat.id] || [];
    const url = images[Math.floor(Math.random() * images.length)];
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
