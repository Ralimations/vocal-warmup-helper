import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Vocal Warmup", description: "A private, local-first vocal training studio." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
