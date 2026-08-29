"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientSiteMenuPdf } from "@/lib/templates/branding";

type MenuPdfViewerProps = {
  documents: ClientSiteMenuPdf[];
};

export function MenuPdfViewer({ documents }: MenuPdfViewerProps) {
  const [active, setActive] = useState<ClientSiteMenuPdf | null>(null);
  const [zoom, setZoom] = useState(1);

  const close = useCallback(() => {
    setActive(null);
    setZoom(1);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, close]);

  if (documents.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => {
              setActive(doc);
              setZoom(1);
            }}
            className="group rounded-2xl border border-[color-mix(in_srgb,var(--client-text)_10%,transparent)] bg-[color-mix(in_srgb,var(--client-primary)_5%,var(--client-background))] p-6 text-left transition hover:border-[color-mix(in_srgb,var(--client-text)_20%,transparent)] hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--client-text)_8%,transparent)]"
          >
            <div className="mb-4 flex h-28 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--client-text)_6%,transparent)]">
              <span className="rounded-full border border-[color-mix(in_srgb,var(--client-text)_15%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]">
                PDF
              </span>
            </div>
            <p className="font-serif text-xl text-[var(--client-text)]">
              {doc.title}
            </p>
            <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]">
              Click to open and zoom
            </p>
          </button>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[color-mix(in_srgb,var(--client-text)_88%,black)]"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} menu`}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-white sm:px-6">
            <div>
              <p className="font-serif text-lg">{active.title}</p>
              <p className="text-xs text-white/70">Pinch or use zoom controls</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
                className="rounded-full border border-white/20 px-3 py-1.5 text-sm"
              >
                −
              </button>
              <span className="min-w-14 text-center text-sm text-white/80">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))}
                className="rounded-full border border-white/20 px-3 py-1.5 text-sm"
              >
                +
              </button>
              <a
                href={active.url}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-full border border-white/20 px-3 py-1.5 text-sm sm:inline-flex"
              >
                Open in new tab
              </a>
              <button
                type="button"
                onClick={close}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-black"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-[#2b2b2b] p-4 sm:p-8">
            <div
              className="mx-auto origin-top transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                width: `${100 / zoom}%`,
              }}
            >
              <iframe
                src={`${active.url}#view=FitH`}
                title={active.title}
                className="h-[78vh] w-full rounded-xl bg-white shadow-2xl"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
