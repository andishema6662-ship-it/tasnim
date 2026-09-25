export const PRESETS = [
  { id: "dawn", label: "سپیده", bg: "linear-gradient(145deg,#f3d2b5,#8e1e2d)" },
  { id: "ink", label: "مرکب", bg: "linear-gradient(145deg,#4a4742,#161412)" },
  { id: "pine", label: "کاج", bg: "linear-gradient(145deg,#d7e6df,#1d4a42)" },
  { id: "sand", label: "کاغذ", bg: "linear-gradient(145deg,#f7f1e6,#c4b59a)" },
  { id: "sea", label: "دریا", bg: "linear-gradient(145deg,#d5e4ef,#1e3a5f)" },
] as const;

export function coverStyle(id: string): string {
  return PRESETS.find((item) => item.id === id)?.bg ?? PRESETS[3].bg;
}

export function suggestCover(title: string): string {
  const sum = [...title].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PRESETS[sum % PRESETS.length].id;
}
