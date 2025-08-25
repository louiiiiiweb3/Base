import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";

// Metadata for the site
export const metadata: Metadata = {
  title: "Linea Waves - Airdrop Checker",
  description: "Check your wallet eligibility for $WAVE airdrop on Linea",
  generator: "v0.app",
};

// Root layout component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Safe fallback to avoid NaN or invalid children
  const safeChildren =
    typeof children === "number" && isNaN(children)
      ? ""
      : children ?? "";

  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Providers>{safeChildren}</Providers>
      </body>
    </html>
  );
}
