"use client";
import { useEffect, useRef } from "react";

let workerPreloaded = false;

export default function ViewerTestPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;

    (async () => {
      const { default: NutrientViewer } = await import("@nutrient-sdk/viewer");

      // Preload the WASM artifacts once per session, as early as possible.
      if (!workerPreloaded) {
        NutrientViewer.preloadWorker({ useCDN: true, document: "/Test_Invoice.jpeg" });
        workerPreloaded = true;
      }

      // React's dev Strict Mode mounts effects twice — always clear
      // whatever might already be attached to this container first.
      NutrientViewer.unload(container);
      if (!active) return;

      await NutrientViewer.load({
        container,
        useCDN: true,
        document: "/Test_Invoice.jpeg",
      });
    })();

    return () => {
      active = false;
      NutrientViewer_cleanup(container);
    };
  }, []);

  return <div ref={containerRef} style={{ height: "100vh", width: "100%" }} />;
}

async function NutrientViewer_cleanup(container: HTMLDivElement) {
  const { default: NutrientViewer } = await import("@nutrient-sdk/viewer");
  NutrientViewer.unload(container);
}