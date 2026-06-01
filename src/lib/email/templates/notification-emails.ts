import "server-only";

type EmailTemplate = {
  subject: string;
  html: string;
};

export function renderNewOfferEmail(args: {
  guideName: string;
  requestUrl: string;
}): EmailTemplate {
  return {
    subject: `Новое предложение от ${args.guideName} — Provodnik`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Новое предложение</h2>
        <p style="color: #555; margin-bottom: 24px;">
          Гид ${args.guideName} откликнулся на ваш запрос.<br/>
          Нажмите кнопку ниже, чтобы посмотреть предложение.
        </p>
        <a href="${args.requestUrl}"
           style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-size:14px;font-weight:500;">
          Посмотреть предложение
        </a>
      </div>
    `,
  };
}

export function renderBookingCreatedEmail(args: {
  bookingUrl: string;
}): EmailTemplate {
  return {
    subject: "Новое бронирование — Provodnik",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Новое бронирование</h2>
        <p style="color: #555; margin-bottom: 24px;">
          У вас новое бронирование.<br/>
          Нажмите кнопку ниже, чтобы открыть детали.
        </p>
        <a href="${args.bookingUrl}"
           style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-size:14px;font-weight:500;">
          Открыть бронирование
        </a>
      </div>
    `,
  };
}

export function renderBookingCancelledEmail(args: {
  bookingUrl: string;
}): EmailTemplate {
  return {
    subject: "Бронирование отменено — Provodnik",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Бронирование отменено</h2>
        <p style="color: #555; margin-bottom: 24px;">
          Бронирование было отменено.<br/>
          Нажмите кнопку ниже, чтобы открыть детали.
        </p>
        <a href="${args.bookingUrl}"
           style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-size:14px;font-weight:500;">
          Открыть бронирование
        </a>
      </div>
    `,
  };
}
