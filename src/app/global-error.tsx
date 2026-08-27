"use client";

import { useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const meridianSans = Plus_Jakarta_Sans({
  variable: "--font-meridian-sans",
  subsets: ["latin"],
  display: "swap",
});

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[app] global error", error);
  }, [error]);

  return (
    <html lang="en" className={`${meridianSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-meridian-sm bg-meridian-teal text-sm font-bold text-meridian-text-inverse"
              >
                M
              </span>
              <p className="text-lg font-semibold tracking-tight text-meridian-text">
                Meridian
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-meridian-blue uppercase">
                500
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
                Something went wrong
              </h1>
              <p className="text-sm leading-relaxed text-meridian-text-muted sm:text-base">
                The app hit an unexpected error. Try again. If it continues,
                contact Meridian support.
              </p>
              {error.digest ? (
                <p className="text-xs text-meridian-text-muted">
                  Reference:{" "}
                  <span className="font-mono">{error.digest}</span>
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-meridian bg-meridian-teal px-5 text-sm font-semibold text-meridian-text-inverse hover:bg-[#125a69]"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
