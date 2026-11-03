import { ogImage, OG_SIZE } from "@/lib/og";
import { NAV } from "@/components/shell/nav";

export const alt = `${NAV.find((n) => n.chapter === "juros")!.label} · Economia, visualizada`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage("juros");
}
