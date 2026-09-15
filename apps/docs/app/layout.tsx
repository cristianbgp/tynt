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
  twitter: { card: "summary", title: "tynt docs", description: "Build and publish tiny monochrome browser games." },
  icons: { icon: "/tynt-mark.svg" },
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
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
