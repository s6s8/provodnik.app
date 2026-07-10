import "server-only";

type EmailTemplate = {
  subject: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderNewOfferEmail(args: {
  guideName: string;
  requestUrl: string;
}): EmailTemplate {
  const guideName = escapeHtml(args.guideName);
  const requestUrl = escapeHtml(args.requestUrl);

  return {
    subject: `Новое предложение от ${args.guideName} — Provodnik`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Новое предложение</h2>
        <p style="color: #555; margin-bottom: 24px;">
          Гид ${guideName} откликнулся на ваш запрос.<br/>
          Нажмите кнопку ниже, чтобы посмотреть предложение.
        </p>
        <a href="${requestUrl}"
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
  const bookingUrl = escapeHtml(args.bookingUrl);

  return {
    subject: "Новое бронирование — Provodnik",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Новое бронирование</h2>
        <p style="color: #555; margin-bottom: 24px;">
          У вас новое бронирование.<br/>
          Нажмите кнопку ниже, чтобы открыть детали.
        </p>
        <a href="${bookingUrl}"
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
  const bookingUrl = escapeHtml(args.bookingUrl);

  return {
    subject: "Бронирование отменено — Provodnik",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Бронирование отменено</h2>
        <p style="color: #555; margin-bottom: 24px;">
          Бронирование было отменено.<br/>
          Нажмите кнопку ниже, чтобы открыть детали.
        </p>
        <a href="${bookingUrl}"
           style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-size:14px;font-weight:500;">
          Открыть бронирование
        </a>
      </div>
    `,
  };
}

export function renderAdminAlertEmail(args: {
  title: string;
  body: string;
  url: string;
}): EmailTemplate {
  const title = escapeHtml(args.title);
  const body = escapeHtml(args.body);
  const url = escapeHtml(args.url);

  return {
    subject: `${args.title} — Provodnik`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">${title}</h2>
        <p style="color: #555; margin-bottom: 24px; white-space: pre-line;">${body}</p>
        <a href="${url}"
           style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-size:14px;font-weight:500;">
          Открыть кабинет
        </a>
      </div>
    `,
  };
}
