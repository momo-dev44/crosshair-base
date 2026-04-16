import Link from "next/link";

function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [];
  const left  = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);

  pages.push(1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("…");
  pages.push(total);

  return pages;
}

interface Props {
  page: number;
  total: number;
  cat: string;
}

function href(page: number, cat: string) {
  return cat === "all" ? `/?page=${page}` : `/?cat=${cat}&page=${page}`;
}

const BTN = "flex h-8 items-center justify-center rounded border text-xs font-semibold transition-colors duration-150";
const ACTIVE = "border-cyan-400/40 bg-cyan-400/10 text-cyan-400 min-w-[2rem] px-1";
const INACTIVE = "border-[#1c2f3d] text-slate-400 hover:text-white hover:border-[#2a4a60] min-w-[2rem] px-1";
const DISABLED = "border-[#111] text-slate-700 cursor-default min-w-[2rem] px-1";
const LABEL = "px-2";

export default function Pagination({ page, total, cat }: Props) {
  if (total < 1) return null;

  const range = getPageRange(page, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 flex-wrap">

      {/* First */}
      {page > 1 ? (
        <Link href={href(1, cat)} className={`${BTN} ${INACTIVE} ${LABEL}`}>First</Link>
      ) : (
        <span className={`${BTN} ${DISABLED} ${LABEL}`}>First</span>
      )}

      {/* Prev */}
      {page > 1 ? (
        <Link href={href(page - 1, cat)} className={`${BTN} ${INACTIVE} ${LABEL}`} aria-label="Previous">‹ Prev</Link>
      ) : (
        <span className={`${BTN} ${DISABLED} ${LABEL}`}>‹ Prev</span>
      )}

      {/* Page numbers */}
      {range.map((item, i) =>
        item === "…" ? (
          <span key={`e${i}`} className="flex h-8 w-5 items-center justify-center text-slate-600 text-xs select-none">…</span>
        ) : (
          <Link
            key={item}
            href={href(item, cat)}
            className={`${BTN} ${item === page ? ACTIVE : INACTIVE}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </Link>
        ),
      )}

      {/* Next */}
      {page < total ? (
        <Link href={href(page + 1, cat)} className={`${BTN} ${INACTIVE} ${LABEL}`} aria-label="Next">Next ›</Link>
      ) : (
        <span className={`${BTN} ${DISABLED} ${LABEL}`}>Next ›</span>
      )}

      {/* Last */}
      {page < total ? (
        <Link href={href(total, cat)} className={`${BTN} ${INACTIVE} ${LABEL}`}>Last</Link>
      ) : (
        <span className={`${BTN} ${DISABLED} ${LABEL}`}>Last</span>
      )}

    </nav>
  );
}
