// Brand type (architecture/design-direction.md §5). Self-hosted by next/font.
import { Anton, DM_Sans, Knewave } from "next/font/google";

export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
export const knewave = Knewave({ weight: "400", subsets: ["latin"], variable: "--font-knewave", display: "swap" });
export const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const fontVars = `${anton.variable} ${knewave.variable} ${dmSans.variable}`;
