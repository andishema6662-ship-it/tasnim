import { coverStyle } from "@/lib/cover";

export function CoverThumb({ cover, className }: { cover: string; className?: string }) {
  const isUrl = /^https?:/i.test(cover);
  const background = isUrl ? `center / cover no-repeat url("${cover.replace(/"/g, "")}")` : coverStyle(cover);
  return <div aria-hidden className={`bg-sand ${className ?? ""}`} style={{ background }} />;
}
