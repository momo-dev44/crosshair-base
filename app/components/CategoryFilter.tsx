"use client";

const CATS: { label: string; value: string }[] = [
  { label: "All",      value: "all" },
  { label: "Pro",      value: "Pro" },
  { label: "Fun",      value: "Fun" },
  { label: "Meme",     value: "Meme" },
  { label: "Circular", value: "Circular" },
];

interface Props {
  current: string;
  onSelect: (cat: string) => void;
  favCount: number;
}

export default function CategoryFilter({ current, onSelect, favCount }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {CATS.map(({ label, value }) => {
        const active = current === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={[
              "px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors duration-150",
              active
                ? "bg-cyan-400/15 text-cyan-400 border border-cyan-400/30"
                : "text-slate-500 border border-transparent hover:text-slate-300 hover:border-[#1c2f3d]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}

      {/* Favorites tab */}
      <button
        onClick={() => onSelect("favorites")}
        className={[
          "px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors duration-150 flex items-center gap-1",
          current === "favorites"
            ? "bg-pink-500/15 text-pink-400 border border-pink-500/30"
            : "text-slate-500 border border-transparent hover:text-pink-400 hover:border-[#1c2f3d]",
        ].join(" ")}
      >
        {/* Heart icon */}
        <svg width="9" height="9" viewBox="0 0 24 24" fill={current === "favorites" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        Favorites
        {favCount > 0 && (
          <span className="ml-0.5 rounded-full bg-pink-500/25 px-1.5 text-[8px] font-bold text-pink-300 leading-[1.6] inline-block">
            {favCount}
          </span>
        )}
      </button>
    </div>
  );
}
