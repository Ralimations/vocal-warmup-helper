import type { Achievement } from "@/types/domain";

export const achievements: Achievement[] = [
  { id: "first-practice", name: "First Practice", description: "Showed up for your voice.", category: "practice", icon: "✦", rarity: "common" },
  { id: "ten-sessions", name: "10 Sessions", description: "Ten little deposits in your voice bank.", category: "practice", icon: "♬", rarity: "common" },
  { id: "ten-day-streak", name: "10 Day Streak", description: "Kept the promise for ten days.", category: "consistency", icon: "🔥", rarity: "rare" },
  { id: "two-octaves", name: "Two Octaves", description: "Confirmed a two-octave range.", category: "range", icon: "↗", rarity: "rare" },
  { id: "highest-note", name: "New Highest Note", description: "Confirmed a new note at the top.", category: "range", icon: "★", rarity: "special" },
  { id: "ninety-accuracy", name: "90% Exercise", description: "Held a steady line through an exercise.", category: "accuracy", icon: "◎", rarity: "rare" },
];
