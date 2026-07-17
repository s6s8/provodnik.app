// src/lib/copy.ts
// Single source of truth for all UI copy strings.
// NEVER hardcode Russian strings in components — import from here.

export const COPY = {
  // Core nouns
  request: 'Запрос',
  requests: 'Запросы',
  offer: 'Предложение',
  offers: 'Предложения',
  trip: 'Поездка',
  trips: 'Поездки',
  traveler: 'Путешественник',
  guide: 'Гид',

  // Actions
  createRequest: 'Создать запрос',
  sendOffer: 'Отправить предложение',
  acceptOffer: 'Принять предложение',
  joinGroup: 'Присоединиться к группе',
  openTicket: 'Открыть билет',
  leaveReview: 'Оставить отзыв',

  // Status labels
  status: {
    awaitingConfirmation: 'Ждёт подтверждения',
    confirmed: 'Подтверждена',
    completed: 'Завершена',
    cancelled: 'Отменена',
    disputed: 'Спор',
    draft: 'Черновик',
    published: 'Опубликовано',
    paused: 'Приостановлено',
    rejected: 'Отказано',
    pending: 'На проверке',
  },

  // Navigation
  nav: {
    inbox: 'Входящие',
    orders: 'Заказы',
    listings: 'Предложения',
    calendar: 'Календарь',
    stats: 'Статистика',
    myRequests: 'Мои запросы',
    openRequests: 'Открытые запросы',
    myTrips: 'Поездки',
    favorites: 'Избранное',
    becomeGuide: 'Стать гидом',
    signIn: 'Войти',
    notifications: 'Уведомления',
  },

  // Empty states — always end with a CTA hint
  empty: {
    noTrips: 'У вас ещё нет поездок.\nКак только гид примет ваш запрос — поездка появится здесь.',
    noIncomingRequests: 'Новых запросов пока нет.\nПутешественники публикуют запросы каждый день.',
    noOrders: 'Подтверждённых заказов пока нет.',
    noListings: 'У вас ещё нет предложений.\nДобавьте первое — путешественники уже ищут гидов.',
    noFavorites: 'Вы ещё не добавили ничего в избранное.',
  },

  // Emotional moments
  moments: {
    bidAcceptedTitle: 'Предложение принято!',
    bidAcceptedBody: (guideName: string) =>
      `Вы выбрали ${guideName}! Гид получил уведомление и скоро подтвердит встречу.`,
    groupJoinSaving: (saving: number, perPerson: number) =>
      `Вы присоединились! При вашей группе каждый платит ${perPerson.toLocaleString('ru')} ₽ вместо ${saving.toLocaleString('ru')} ₽`,
    contactUnlockTitle: (guideName: string) =>
      `Контакты ${guideName} теперь доступны`,
    tripCompletedTitle: (guideName: string) =>
      `Как прошла поездка с ${guideName}?`,
  },

  // Payment reality. There is no gateway and no platform prepayment anywhere in
  // the product: accepting an offer inserts a booking directly and seeds a
  // `payment_agreements` row with method 'in_person' (src/lib/supabase/bookings.ts).
  // Every payment-facing string must come from here so copy cannot drift back
  // into promising a prepayment flow that does not exist.
  payment: {
    // Full sentence for panels/alerts that explain what happens after booking.
    bookingNote:
      'Оплата напрямую гиду — наличными или переводом. Финальные условия фиксируются в заявке и подтверждении.',
    // Compact variant for bullet/fact lists.
    bookingNoteShort: 'Оплата напрямую гиду — наличными или переводом',
  },

  // Post-join confirmation panel
  postJoin: {
    title: 'Вы в группе',
    nextStepsHeading: 'Что дальше',
    step1: 'Гиды видят группу и присылают свои предложения.',
    step2: 'Когда хозяин группы принимает предложение, открывается контакт гида и точная точка встречи.',
    step3: 'Оплата происходит напрямую гиду; финальные условия фиксируются в заявке и подтверждении.',
    ctaToMyRequests: 'Перейти к моим запросам',
  },

} as const
