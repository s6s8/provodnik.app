import { listSeededNotificationsForUser } from "@/data/notifications/seed";
import type { NotificationRecord } from "@/data/notifications/types";

const STORAGE_KEY_PREFIX = "provodnik.notifications.read.v1.";
const NOTIFICATIONS_CHANGED_EVENT = "provodnik:notifications-changed";

type ReadState = Record<string, string>;

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function dispatchNotificationsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

function getLocalReadState(userId: string): ReadState {
  if (typeof window === "undefined") return {};
  const parsed = safeParseJson<ReadState>(window.localStorage.getItem(storageKey(userId)));
  if (!parsed || typeof parsed !== "object") return {};
  return parsed;
}

function saveLocalReadState(userId: string, state: ReadState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  dispatchNotificationsChanged();
}

function ensureSeededReadStateInitialized(userId: string) {
  if (typeof window === "undefined") return;
  const existing = window.localStorage.getItem(storageKey(userId));
  if (existing) return;

  const seeded = listSeededNotificationsForUser(userId);
  const initial: ReadState = {};
  for (const item of seeded) {
    if (item.readAt) initial[item.id] = item.readAt;
  }
  window.localStorage.setItem(storageKey(userId), JSON.stringify(initial));
}

export function subscribeToNotificationsChanged(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  function onEvent() {
    callback();
  }

  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onEvent);
  window.addEventListener("storage", onEvent);
  return () => {
    window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onEvent);
    window.removeEventListener("storage", onEvent);
  };
}

export function listNotificationsForUser(userId: string): NotificationRecord[] {
  ensureSeededReadStateInitialized(userId);
  const seeded = listSeededNotificationsForUser(userId);
  const readState = getLocalReadState(userId);

  return seeded.map((item) => ({
    ...item,
    readAt: readState[item.id] ?? null,
    metadata: item.metadata ? { ...item.metadata } : undefined,
  }));
}

export function countUnreadNotificationsForUser(userId: string): number {
  return listNotificationsForUser(userId).filter((item) => item.readAt === null).length;
}

export function markNotificationRead(userId: string, notificationId: string) {
  ensureSeededReadStateInitialized(userId);
  const state = getLocalReadState(userId);
  state[notificationId] = new Date().toISOString();
  saveLocalReadState(userId, state);
}

export function markNotificationUnread(userId: string, notificationId: string) {
  ensureSeededReadStateInitialized(userId);
  const state = getLocalReadState(userId);
  delete state[notificationId];
  saveLocalReadState(userId, state);
}

export function markAllNotificationsRead(userId: string) {
  ensureSeededReadStateInitialized(userId);
  const notifications = listSeededNotificationsForUser(userId);
  const state = getLocalReadState(userId);
  const now = new Date().toISOString();

  for (const item of notifications) {
    state[item.id] = state[item.id] ?? now;
  }

  saveLocalReadState(userId, state);
}

