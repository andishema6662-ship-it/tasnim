import type { SocialChannelConfig, Story } from "./types";

export function formatSocialPost(story: Story, channel: SocialChannelConfig, siteBase = "/site") {
  const link = `${siteBase}/${story.id}`;
  const hashtags = story.tags.length ? story.tags.map((tag) => `#${tag.replace(/\s+/g, "_")}`).join(" ") : "";
  return channel.template
    .replace(/\{title\}/g, story.title)
    .replace(/\{lead\}/g, story.lead)
    .replace(/\{hashtags\}/g, hashtags)
    .replace(/\{link\}/g, link)
    .trim();
}
