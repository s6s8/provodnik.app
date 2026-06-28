import type { LucideIcon } from "lucide-react";

import type { FlagName } from "@/lib/flags";
import {
  Users, Compass, UserSearch, Map, Search, Route, BadgeCheck, ShieldCheck,
  Briefcase, HelpCircle, LogIn, ClipboardList, Luggage, Heart, MessageSquare,
  Bell, Gift, User, Inbox, BookCheck, Star, Calendar, Settings,
  BarChart3, UserCheck, Flag, CalendarCheck, ScrollText,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  activePrefixes?: readonly string[];
  external?: boolean;
};

export const ROUTES = {
  requests:     { href: "/requests",     label: "Открытые группы",   icon: Users },
  listings:     { href: "/listings",     label: "Готовые экскурсии", icon: Compass },
  guides:       { href: "/guides",       label: "Гиды",              icon: UserSearch },
  destinations: { href: "/destinations", label: "Направления",       icon: Map },
  search:       { href: "/search",       label: "Поиск",             icon: Search },
  newRequest:   { href: "/",             label: "Создать запрос",    icon: ClipboardList },
  howItWorks:   { href: "/how-it-works", label: "Как это работает",  icon: Route },
  becomeGuide:  { href: "/become-a-guide", label: "Стать гидом",     icon: BadgeCheck },
  trust:        { href: "/trust",        label: "Доверие и безопасность", icon: ShieldCheck },
  forBusiness:  { href: "/for-business", label: "Для бизнеса",       icon: Briefcase },
  help:         { href: "/help",         label: "Помощь",            icon: HelpCircle },
  auth:         { href: "/auth",         label: "Войти",             icon: LogIn },
  trips:        { href: "/trips",        label: "Мои запросы",       icon: ClipboardList },
  myBookings:   { href: "/bookings",     label: "Поездки",           icon: Luggage },
  favorites:    { href: "/favorites",    label: "Избранное",         icon: Heart },
  messages:     { href: "/messages",     label: "Сообщения",         icon: MessageSquare, activePrefixes: ["/messages"] },
  notifications:{ href: "/notifications",label: "Уведомления",       icon: Bell },
  referrals:    { href: "/referrals",    label: "Приглашения",       icon: Gift },
  account:      { href: "/account",      label: "Профиль",           icon: User },
  guideInbox:   { href: "/guide",          label: "Запросы",         icon: Inbox, activePrefixes: ["/guide/inbox"] },
  guideListings:{ href: "/guide/listings", label: "Мои экскурсии", shortLabel: "Экскурсии", icon: Compass },
  guideBookings:{ href: "/guide/bookings", label: "Заказы",          icon: BookCheck },
  guideReviews: { href: "/guide/reviews",  label: "Отзывы",          icon: Star },
  guideCalendar:{ href: "/guide/calendar", label: "Календарь",       icon: Calendar },
  guideProfile: { href: "/guide/profile",  label: "Профиль",         icon: User },
  guideSettings:{ href: "/guide/settings/contact-visibility", label: "Настройки", icon: Settings },
  adminDashboard: { href: "/admin/dashboard",  label: "Обзор",        icon: BarChart3 },
  adminGuides:    { href: "/admin/guides",     label: "Гиды",         icon: UserCheck },
  adminListings:  { href: "/admin/listings",   label: "Листинги",     icon: ClipboardList },
  adminModeration:{ href: "/admin/moderation", label: "Модерация",    icon: ShieldCheck },
  adminDisputes:  { href: "/admin/disputes",   label: "Споры",        icon: Flag },
  adminBookings:  { href: "/admin/bookings",   label: "Бронирования", shortLabel: "Брони", icon: CalendarCheck },
  adminAudit:     { href: "/admin/audit",      label: "Аудит",        icon: ScrollText },
} satisfies Record<string, NavItem>;

const adminBridge: NavItem = { ...ROUTES.adminDashboard, label: "Админка" };

export const headerPrimary = {
  anon:     [ROUTES.requests, ROUTES.listings, ROUTES.guides, ROUTES.destinations, ROUTES.howItWorks],
  traveler: [ROUTES.requests, ROUTES.listings, ROUTES.destinations, ROUTES.trips],
  guide:    [ROUTES.guideInbox, ROUTES.guideListings, ROUTES.guideBookings, ROUTES.guideReviews],
  admin:    [ROUTES.requests, ROUTES.guides, ROUTES.destinations, adminBridge],
} as const;

export const accountMenu = {
  traveler: [ROUTES.account, ROUTES.myBookings, ROUTES.favorites, ROUTES.notifications, ROUTES.referrals, ROUTES.help],
  guide:    [ROUTES.guideProfile, ROUTES.guideCalendar, ROUTES.guideSettings, ROUTES.help],
  admin:    [adminBridge, ROUTES.account, ROUTES.help],
} as const;

export const guideBottomNav = [ROUTES.guideInbox, ROUTES.guideListings, ROUTES.guideBookings, ROUTES.guideReviews] as const;
export const adminNav = [ROUTES.adminDashboard, ROUTES.adminGuides, ROUTES.adminListings, ROUTES.adminModeration, ROUTES.adminDisputes, ROUTES.adminBookings, ROUTES.adminAudit] as const;

export const footerNav = {
  about:   [ROUTES.howItWorks, ROUTES.trust, ROUTES.becomeGuide, ROUTES.forBusiness],
  support: [ROUTES.help,
            { href: "https://t.me/provodnik_help", label: "Telegram-поддержка", icon: MessageSquare, external: true } as NavItem,
            { href: "mailto:support@provodnik.app", label: "Email: support@provodnik.app", icon: MessageSquare } as NavItem],
  legal:   [
    { href: "/policies/terms",   label: "Условия использования", icon: ScrollText } as NavItem,
    { href: "/policies/privacy", label: "Конфиденциальность",    icon: ScrollText } as NavItem,
    { href: "/policies/cookies", label: "Cookies",               icon: ScrollText } as NavItem,
  ],
} as const;

/**
 * Nav hrefs whose destination page is feature-gated (renders `notFound()` when
 * the flag is off). Links to these routes must be hidden when the flag is
 * disabled so demo/QA navigation never lands on a "не найдена" page.
 */
export const NAV_FLAG_BY_HREF = {
  "/help": "FEATURE_TR_HELP",
  "/favorites": "FEATURE_TR_FAVORITES",
  "/referrals": "FEATURE_TR_REFERRALS",
} as const satisfies Partial<Record<string, FlagName>>;

/**
 * Hrefs that must be hidden given a set of resolved feature flags. Flag values
 * are resolved server-side (env is server-only) and the resulting list is the
 * serializable contract passed to client nav components.
 */
export function hiddenNavHrefsForFlags(
  isEnabled: (flag: FlagName) => boolean,
): string[] {
  return Object.entries(NAV_FLAG_BY_HREF)
    .filter(([, flag]) => !isEnabled(flag))
    .map(([href]) => href);
}

export function filterNavItemsByHiddenHrefs(
  items: readonly NavItem[],
  hiddenHrefs: readonly string[],
): NavItem[] {
  if (hiddenHrefs.length === 0) return [...items];
  return items.filter((item) => !hiddenHrefs.includes(item.href));
}

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.activePrefixes) {
    return pathname === item.href || item.activePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
