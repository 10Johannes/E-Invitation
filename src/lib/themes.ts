export type ThemeId =
  | "dusty-pink"
  | "sage-cream"
  | "navy-gold"
  | "terracotta"
  | "lavender-mist"
  | "classic-ivory";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  swatches: readonly [string, string, string, string];
};

export const THEMES: readonly ThemeMeta[] = [
  {
    id: "dusty-pink",
    label: "Dusty Pink",
    swatches: ["#6E434D", "#A86B78", "#C99AA4", "#EBDBDD"],
  },
  {
    id: "sage-cream",
    label: "Sage & Cream",
    swatches: ["#4A5240", "#7C9070", "#A3B18A", "#E9EAE0"],
  },
  {
    id: "navy-gold",
    label: "Navy & Gold",
    swatches: ["#23324D", "#A98844", "#C9A961", "#E8E6DF"],
  },
  {
    id: "terracotta",
    label: "Terracotta",
    swatches: ["#7C4630", "#B26E4F", "#D2967C", "#F0E2D8"],
  },
  {
    id: "lavender-mist",
    label: "Lavender Mist",
    swatches: ["#574470", "#967BB0", "#B9A3CE", "#E9E2EE"],
  },
  {
    id: "classic-ivory",
    label: "Classic Ivory",
    swatches: ["#5C5040", "#A89268", "#CBB794", "#F1EDE4"],
  },
];

export const DEFAULT_THEME: ThemeId = "dusty-pink";

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" && THEMES.some((theme) => theme.id === value)
  );
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
