"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Renders third-party widget HTML/script/iframe; runs <script> tags after mount. */
export function PortalWidgetEmbed({ code, testId }: { code: string; testId?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = "";
    const trimmed = code.trim();
    if (!trimmed) return;

    const template = document.createElement("template");
    template.innerHTML = trimmed;
    host.appendChild(template.content.cloneNode(true));

    host.querySelectorAll("script").forEach((oldScript) => {
      const script = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
      script.text = oldScript.textContent ?? "";
      oldScript.parentNode?.replaceChild(script, oldScript);
    });
  }, [code]);

  return <div ref={ref} className="live-widget-embed min-h-[2rem] w-full overflow-hidden" data-testid={testId ?? "live-widget-embed"} />;
}

export function LiveWidgetSection({
  title,
  enabled,
  embedCode,
  fallback,
  testId,
}: {
  title: string;
  enabled: boolean;
  embedCode: string;
  fallback: ReactNode;
  testId?: string;
}) {
  if (!enabled) return null;
  const hasEmbed = Boolean(embedCode.trim());
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm" data-testid={testId}>
      <h2 className="border-r-4 border-[var(--portal-primary)] pr-2 text-sm font-bold">{title}</h2>
      <div className="mt-3">
        {hasEmbed ? <PortalWidgetEmbed code={embedCode} testId={`${testId}-embed`} /> : fallback}
      </div>
    </section>
  );
}
