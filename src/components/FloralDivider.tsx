import { BrushHeart } from "@/components/Ornaments";

export default function FloralDivider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-3 text-dusty ${className}`}
    >
      <svg
        viewBox="0 0 120 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className="h-4 w-24 sm:w-28"
      >
        <path
          d="M118 13 C 98 5, 74 6, 61 12 M92 9.5 C 87 5, 80 4, 76 7.5 M104 11 C 101 8.5, 97 7.5, 94 9"
          strokeWidth="1.3"
        />
      </svg>
      <BrushHeart className="h-4 w-auto shrink-0 text-deeprose/70" />
      <svg
        viewBox="0 0 120 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className="h-4 w-24 sm:w-28"
        style={{ transform: "scaleX(-1)" }}
      >
        <path
          d="M118 13 C 98 5, 74 6, 61 12 M92 9.5 C 87 5, 80 4, 76 7.5 M104 11 C 101 8.5, 97 7.5, 94 9"
          strokeWidth="1.3"
        />
      </svg>
    </div>
  );
}
