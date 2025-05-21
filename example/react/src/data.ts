export interface UnifiedItem {
  id: number;
  label: string;
  category: string;
}

export const unifiedData: UnifiedItem[] = [
  { id: 1, label: "Apple", category: "fruit" },
  { id: 2, label: "Banana", category: "fruit" },
  { id: 3, label: "Cherry", category: "fruit" },
  { id: 4, label: "Carrot", category: "vegetable" },
  { id: 5, label: "Broccoli", category: "vegetable" },
  { id: 6, label: "Spinach", category: "vegetable" },
  { id: 7, label: "Dog", category: "animal" },
  { id: 8, label: "Cat", category: "animal" },
  { id: 9, label: "Elephant", category: "animal" },
  { id: 10, label: "Lion", category: "animal" },
];
