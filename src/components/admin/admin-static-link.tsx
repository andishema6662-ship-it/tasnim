"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type AdminStaticLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

function hrefToPath(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  if (typeof href === "object" && href.pathname) {
    const query = href.query;
    if (!query || typeof query !== "object") return href.pathname;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value == null) continue;
      params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${href.pathname}?${qs}` : href.pathname;
  }
  return String(href);
}

/** Static export: use full page loads between /admin/* HTML entries (App Router client nav is unreliable). */
export function AdminStaticLink({ href, onClick, children, ...rest }: AdminStaticLinkProps) {
  const target = hrefToPath(href);
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        window.location.assign(target);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
