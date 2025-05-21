export interface UnifiedItem {
  id: number;
  label: string;
  category: string;
  taste?: {
    brix: number;
  };
  mbti?: string;
}

export const unifiedData: UnifiedItem[] = [
  { id: 1, label: "Apple", category: "fruit", taste: { brix: 10 } },
  { id: 2, label: "Banana", category: "fruit", taste: { brix: 15 } },
  {
    id: 3,
    label: "Cherry",
    category: "fruit",
    taste: { brix: 10 },
  },
  { id: 4, label: "Carrot", category: "vegetable", taste: { brix: 2 } },
  { id: 5, label: "Broccoli", category: "vegetable", taste: { brix: 1 } },
  { id: 6, label: "Spinach", category: "vegetable", taste: { brix: 1 } },
  { id: 7, label: "Dog", category: "animal", mbti: "ENFP" },
  { id: 8, label: "Cat", category: "animal", mbti: "INFP" },
  { id: 9, label: "Elephant", category: "animal", mbti: "ENFP" },
  { id: 10, label: "Lion", category: "animal", mbti: "ISTJ" },
];
