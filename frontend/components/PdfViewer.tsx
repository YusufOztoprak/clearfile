"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

// Loaded from Nutrient's CDN instead of an npm package — no backend or build
// config changes needed, just a <script> tag injected at runtime. Only
// happens once per page load: if another PdfViewer instance already
// injected the script, this one waits on the same <script> element instead
// of adding a duplicate.
const SDK_SCRIPT_SRC = "https://cdn.cloud.nutrient.io/pspdfkit-web@1.20.0/nutrient-viewer.js";
const SDK_SCRIPT_ID = "nutrient-viewer-sdk";

// Optional — Nutrient's own Next.js getting-started guide doesn't require a
// licenseKey for trial/dev use (it just shows a watermark without one). Only
// set NEXT_PUBLIC_NUTRIENT_LICENSE_KEY if you have a genuine Web SDK key —
// the DWS Processor/Data Extraction/Viewer API keys (pdf_live_...) are a
// different product and won't work here, so leaving this unset is safer
// than passing the wrong kind of key.
const LICENSE_KEY = process.env.NEXT_PUBLIC_NUTRIENT_LICENSE_KEY || undefined;

declare global {
  interface Window {
    NutrientViewer?: {
      load: (config: {
        container: HTMLElement | string;
        document: string;
        useCDN?: boolean;
        licenseKey?: string;
      }) => Promise<unknown>;
      unload: (container: HTMLElement | string) => void;
    };
  }
}

function loadSdkScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.NutrientViewer) {
      resolve();
      return;
    }

    const existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("SDK script failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.src = SDK_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("SDK script failed to load"));
    document.body.appendChild(script);
  });
}

export default function PdfViewer({
  documentUrl,
  className,
}: {
  // Must be a URL the browser can fetch directly (same-origin or CORS-enabled).
  // e.g. `${API_BASE}/documents/{id}/download` once that backend route exists.
  documentUrl: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    loadSdkScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.NutrientViewer) return;
        return window.NutrientViewer.load({
          container: containerRef.current,
          document: documentUrl,
          // Required since SDK 1.9 — without it, the SDK tries to
          // auto-detect where its own WebAssembly assets live and fails to
          // initialize (this was the actual cause of the "error occurred
          // while initializing" message, not the license key).
          useCDN: true,
          ...(LICENSE_KEY ? { licenseKey: LICENSE_KEY } : {}),
        });
      })
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Could not load the PDF viewer."
        );
      });

    return () => {
      cancelled = true;
      if (containerRef.current && window.NutrientViewer) {
        window.NutrientViewer.unload(containerRef.current);
      }
    };
    // documentUrl is the only thing that should trigger a reload —
    // re-running for unrelated re-renders would tear down and rebuild
    // the viewer for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentUrl]);

  return (
    <div className={`relative h-full min-h-[70vh] w-full overflow-hidden rounded-md border border-border ${className ?? ""}`}>
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading document…
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted p-6 text-center text-sm text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p>{errorMessage}</p>
          <p className="text-xs text-muted-foreground">
            Check that <code>GET /documents/&#123;id&#125;/download</code> exists on the backend and returns the
            signed PDF — this is the most common cause once the SDK itself initializes correctly.
          </p>
        </div>
      )}

      {/* NutrientViewer.load() takes over this element's DOM directly —
          it must stay mounted (not conditionally rendered) even while
          status is "loading" or "error", or the SDK has nothing to attach to. */}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
