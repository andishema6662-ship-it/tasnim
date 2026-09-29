"use client";

import { faNum } from "@/lib/format";
import { useNewsroom } from "@/lib/store";

export function PortalPollWidget() {
  const { data, update } = useNewsroom();
  const poll = data.polls.find((item) => item.showOnHomepage && !item.closed);
  if (!poll) return null;
  const total = poll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm" data-testid="portal-home-poll">
      <h2 className="border-r-4 border-[var(--portal-primary)] pr-2 text-sm font-bold">نظرسنجی</h2>
      <p className="mt-2 text-sm font-semibold">{poll.question}</p>
      <ul className="mt-3 space-y-2">
        {poll.options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className="w-full rounded border border-line px-3 py-2 text-right text-sm hover:border-[var(--portal-primary)]"
              onClick={() =>
                update((current) => ({
                  ...current,
                  polls: current.polls.map((item) =>
                    item.id === poll.id
                      ? { ...item, options: item.options.map((choice) => (choice.id === option.id ? { ...choice, votes: choice.votes + 1 } : choice)) }
                      : item,
                  ),
                }))
              }
            >
              {option.label}
              <span className="float-left text-xs text-muted">
                {faNum(option.votes)}
                {total ? ` (${faNum(Math.round((option.votes / (total + 1)) * 100))}٪)` : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-muted" dir="ltr">[{poll.shortCode}]</p>
    </section>
  );
}
