import { coverStyle } from "@/lib/cover";

export function CoverThumb({ cover, className }: { cover: string; className?: string }) {
  const isUrl = /^https?:/i.test(cover) || /^data:image\//i.test(cover);
  if (isUrl) {
    return <img src={cover} alt="" className={`bg-sand object-cover ${className ?? ""}`} />;
  }
  const background = coverStyle(cover);
  return <div aria-hidden className={`bg-sand ${className ?? ""}`} style={{ background }} />;
}
