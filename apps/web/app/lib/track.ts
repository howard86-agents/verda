type EventName =
  | "story_view"
  | "story_read_complete"
  | "growth_item_level_up"
  | "story_collect"
  | "story_uncollect"
  | "daily_check_in"
  | "admin_article_publish"
  | "growth_item_redeemed";

interface TrackEvent {
  name: EventName;
  props?: Record<string, unknown>;
  ts: number;
}

const LOG: TrackEvent[] = [];

export function track(name: EventName, props?: Record<string, unknown>) {
  const event: TrackEvent = { name, props, ts: Date.now() };
  LOG.push(event);
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.debug("[track]", name, props);
  }
}

export function getTrackLog(): TrackEvent[] {
  return LOG;
}
