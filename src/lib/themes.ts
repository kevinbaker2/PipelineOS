export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  preview: { bg: string; card: string; primary: string; accent: string };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Deep dark default with blue accents",
    preview: { bg: "#0a0f1a", card: "#0a0f1a", primary: "#3b82f6", accent: "#1e3a5f" },
  },
  {
    id: "ocean-deep",
    name: "Ocean Deep",
    description: "Rich navy with teal and warm orange highlights",
    preview: { bg: "#092638", card: "#071e2e", primary: "#00b4d8", accent: "#e8852a" },
  },
  {
    id: "arctic",
    name: "Arctic",
    description: "Light icy blue with bright teal accents",
    preview: { bg: "#ebf8ff", card: "#ffffff", primary: "#00b4d8", accent: "#e8852a" },
  },
  {
    id: "steel",
    name: "Steel",
    description: "Sleek gunmetal dark with bright blue glow",
    preview: { bg: "#161b2e", card: "#1f2937", primary: "#5b9cf6", accent: "#5b9cf6" },
  },
  {
    id: "cloud",
    name: "Cloud",
    description: "Clean white with soft violet accents",
    preview: { bg: "#ffffff", card: "#eef2ff", primary: "#6366f1", accent: "#6366f1" },
  },
  {
    id: "wildcard",
    name: "Wildcard",
    description: "A different theme every day",
    preview: { bg: "#1a1a2e", card: "#16213e", primary: "#e94560", accent: "#0f3460" },
  },
];

const CONCRETE_THEMES = THEMES.filter((t) => t.id !== "wildcard");

export const VALID_THEMES = new Set(THEMES.map((t) => t.id));

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function resolveTheme(theme: string): string {
  if (theme === "wildcard") {
    const idx = dayOfYear() % CONCRETE_THEMES.length;
    return CONCRETE_THEMES[idx].id;
  }
  return theme;
}

export function getWildcardLabel(theme: string): string | null {
  if (theme !== "wildcard") return null;
  const resolved = resolveTheme(theme);
  const t = THEMES.find((th) => th.id === resolved);
  return t ? `Today's theme: ${t.name}` : null;
}
