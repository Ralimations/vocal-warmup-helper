"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FunctionalPracticeModal } from "@/components/practice/functional-practice-modal";
import { APP_VERSION } from "@/lib/alpha";

type ViewName = "dashboard" | "practice" | "routines" | "analytics" | "achievements" | "songs" | "profile" | "settings";

const viewTitles: Record<ViewName, string> = {
  dashboard: "Vocal Warmup",
  practice: "Practice",
  routines: "Routines",
  analytics: "Analytics",
  achievements: "Achievements",
  songs: "Songs",
  profile: "Profile",
  settings: "Settings",
};

export function AppShell({ initialView }: { initialView: ViewName }) {
  const pathname = usePathname();
  const [practiceOpen, setPracticeOpen] = useState(false);
  const view = (pathname.split("/")[1] || initialView) as ViewName;
  const title = viewTitles[view] ?? viewTitles[initialView];

  return (
    <main className="app-shell">
      <header className="app-header">
        <Link href="/" className="app-title">Vocal Warmup</Link>
        <nav aria-label="Primary navigation" className="app-nav">
          <Link href="/">Home</Link>
          <Link href="/practice">Practice</Link>
        </nav>
      </header>

      <section className="app-content" aria-labelledby="page-title">
        <h1 id="page-title">{title}</h1>
        {view === "dashboard" || view === "practice" ? (
          <div className="base-panel">
            <p>Local microphone pitch tracking and guided warmup practice.</p>
            <button type="button" className="primary-button" onClick={() => setPracticeOpen(true)}>
              Start practice
            </button>
            <p className="muted">Your voice is processed in this browser. Audio is not uploaded.</p>
            <div className="tester-guidance">
              <strong>Alpha testing notes</strong>
              <ul>
                <li>Headphones are recommended for baseline testing.</li>
                <li>Allow microphone permission; audio is processed locally.</li>
                <li>Test in a quiet room where practical.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="base-panel">
            <p>This feature is not part of the base build yet.</p>
            <Link href="/practice" className="secondary-button">Go to practice</Link>
          </div>
        )}
      </section>

      <footer className="app-footer"><span>{APP_VERSION}</span><span>Alpha · local microphone processing</span></footer>

      {practiceOpen && <FunctionalPracticeModal onClose={() => setPracticeOpen(false)} />}
    </main>
  );
}
