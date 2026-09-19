import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/geist-mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://docs.tynt.dev"),
  title: {
    default: "tynt docs",
    template: "%s | tynt docs",
  },
  description: "Learn how to create and publish tiny browser games with tynt.",
  applicationName: "tynt docs",
  openGraph: {
    type: "website",
    siteName: "tynt docs",
    title: "tynt docs",
    description: "Build and publish tiny monochrome browser games.",
    url: "https://docs.tynt.dev/docs",
  },
  twitter: {
    card: "summary",
    title: "tynt docs",
    description: "Build and publish tiny monochrome browser games.",
  },
  icons: {
    icon: [
      { url: "/tynt-mark.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

const themeScript = `(() => {
  const saved = localStorage.getItem("tynt-docs-theme");
  const preference = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
})()`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
