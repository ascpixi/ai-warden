import { VT323 } from "next/font/google";
import type { Metadata } from "next";

import "./css/styles.scss";
import { WithFilters } from "./CssFilters";

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
      <head>
        <link rel="preload" href="/img/rgb_pattern.png" as="image" />
        <link rel="preload" href="/img/warden-16px-t0.png" as="image" />
        <link rel="preload" href="/img/warden-16px-t1.png" as="image" />
        <link rel="preload" href="/img/warden-16px-t2.png" as="image" />
        <link rel="preload" href="/img/warden-16px-t2.png" as="image" />
      </head>

      <body className={`${font.className}`}>
        <WithFilters>
          {children}
        </WithFilters>
      </body>
    </html>
  );
}
