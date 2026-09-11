import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pairly — Make moments together",
  description:
    "A private realtime space for two people to make, play, and keep moments together.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
