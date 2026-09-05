export type CarouselEffect = "fan" | "flip" | "swirl";

export const CAROUSEL_EFFECTS: readonly {
  id: CarouselEffect;
  label: string;
}[] = [
  { id: "fan", label: "Fan" },
  { id: "flip", label: "Flip" },
  { id: "swirl", label: "Swirl" },
];

export function isCarouselEffect(value: unknown): value is CarouselEffect {
  return (
    value === "fan" || value === "flip" || value === "swirl"
  );
}