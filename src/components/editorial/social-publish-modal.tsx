"use client";

import { useMemo, useState } from "react";
import { formatSocialPost } from "@/lib/social-publish";
import { SOCIAL_CHANNEL_LABELS } from "@/lib/reporter-labels";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { Story } from "@/lib/types";
import { Button, Field, Flash, Select, TextArea } from "../ui";

export function SocialPublishModal({ story, onClose }: { story: Story; onClose: () => void }) {
  const { data, update } = useNewsroom();
  const channels = useMemo(() => (data.socialChannels ?? []).filter((item) => item.enabled), [data.socialChannels]);
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [flash, setFlash] = useState("");
  const channel = channels.find((item) => item.id === channelId);
  const preview = channel ? formatSocialPost(story, channel) : "";

  function publish() {
    if (!channel) {
      setFlash("کانال فعالی انتخاب نشده است. از بخش انتشار در شبکه‌ها الگو را تنظیم کنید.");
      return;
    }
    const text = preview;
    update((current) => ({
      ...current,
      social: [
        {
          id: uid("soc"),
          channel: SOCIAL_CHANNEL_LABELS[channel.channel],
          text,
          storyId: story.id,
          status: "draft",
          createdAt: new Date().toISOString(),
        },
        ...current.social,
      ],
    }));
    setFlash(`پیش‌نویس ${SOCIAL_CHANNEL_LABELS[channel.channel]} ذخیره شد (شبیه‌سازی انتشار).`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" data-testid="social-publish-modal">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-sheet p-4 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold">انتشار در شبکه‌های اجتماعی</h2>
          <Button type="button" tone="ghost" onClick={onClose}>بستن</Button>
        </div>
        <p className="mt-1 text-sm text-muted line-clamp-2">{story.title}</p>
        <Flash>{flash}</Flash>
        {channels.length === 0 ? (
          <p className="text-sm text-muted">هیچ کانال فعالی تعریف نشده است.</p>
        ) : (
          <>
            <Field label="کانال">
              <Select value={channelId} onChange={(event) => setChannelId(event.target.value)} data-testid="social-channel-select">
                {channels.map((item) => (
                  <option key={item.id} value={item.id}>{SOCIAL_CHANNEL_LABELS[item.channel]}</option>
                ))}
              </Select>
            </Field>
            <Field label="پیش‌نمایش متن">
              <TextArea rows={8} value={preview} readOnly data-testid="social-publish-preview" />
            </Field>
            <Button type="button" onClick={publish} data-testid="social-publish-submit">ثبت انتشار</Button>
          </>
        )}
      </div>
    </div>
  );
}
