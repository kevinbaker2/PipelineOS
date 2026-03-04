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
    id: "crimson",
    name: "Crimson",
    description: "Bold dark red with rose accents",
    preview: { bg: "#1a0a0f", card: "#2d0f1a", primary: "#e11d48", accent: "#e11d48" },
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
    description: "Tomorrow's will be different",
    preview: { bg: "#1a1a2e", card: "#16213e", primary: "#e94560", accent: "#0f3460" },
  },
];

export const VALID_THEMES = new Set(THEMES.map((t) => t.id));

export const THEME_CSS_VARS = [
  "--background", "--foreground", "--card", "--card-foreground",
  "--popover", "--popover-foreground", "--primary", "--primary-foreground",
  "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
  "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
  "--border", "--input", "--ring",
];

// --- Seeded RNG from date string ---

function seedRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) | 0;
    return (h >>> 0) / 4294967296;
  };
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// --- HSL to hex for preview dots ---

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// --- Wildcard palette generation ---

export interface WildcardPalette {
  vars: Record<string, string>;
  preview: { bg: string; card: string; primary: string; accent: string };
}

export function generateWildcardPalette(): WildcardPalette {
  const rng = seedRandom(todayString());
  const hue = Math.floor(rng() * 360);
  const compHue = (hue + 150) % 360;

  return {
    vars: {
      "--background": `${hue} 15% 6%`,
      "--foreground": `${hue} 15% 93%`,
      "--card": `${hue} 18% 10%`,
      "--card-foreground": `${hue} 15% 93%`,
      "--popover": `${hue} 18% 10%`,
      "--popover-foreground": `${hue} 15% 93%`,
      "--primary": `${hue} 85% 55%`,
      "--primary-foreground": `${hue} 15% 6%`,
      "--secondary": `${hue} 20% 15%`,
      "--secondary-foreground": `${hue} 15% 93%`,
      "--muted": `${hue} 20% 15%`,
      "--muted-foreground": `${hue} 15% 55%`,
      "--accent": `${compHue} 80% 55%`,
      "--accent-foreground": `${compHue} 15% 6%`,
      "--destructive": "0 63% 31%",
      "--destructive-foreground": "210 40% 98%",
      "--border": `${hue} 25% 18%`,
      "--input": `${hue} 25% 18%`,
      "--ring": `${hue} 85% 55%`,
    },
    preview: {
      bg: hslToHex(hue, 15, 6),
      card: hslToHex(hue, 18, 10),
      primary: hslToHex(hue, 85, 55),
      accent: hslToHex(compHue, 80, 55),
    },
  };
}

export function resolveTheme(theme: string): string {
  return theme;
}
