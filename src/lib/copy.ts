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
    noRequests: 'У вас ещё нет запросов.\nОпишите свою мечту — гиды сами вас найдут.',
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

} as const
