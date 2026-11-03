import { ogImage, OG_SIZE } from "@/lib/og";

export const alt = "Economia, visualizada: modelos econômicos interativos do Brasil";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage();
}
