import type { Metadata } from "next";
import { fontVars } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eat. Different. — E.D. | Kansas City comfort food",
  description:
    "Comfort food. Different rules. Hot honey chicken & waffles, smashed burgers and teriyaki after dark, cooked by Eddie in Kansas City. Order for pickup and help fuel the E.D. truck.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
