import { VT323 } from "next/font/google";
import type { Metadata } from "next";

import "./css/styles.scss";
import { CssFilters } from "./CssFilters";

export const metadata: Metadata = {
  title: "AI Warden",
  description: "Try to convince an AI warden to let you out of your prison!",
};

const font = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--vt323"
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${font.className}`}>
        <>
          <CssFilters />
          {children}
        </>
      </body>
    </html>
  );
}
