import { describe, expect, it } from "vitest";

import {
  renderBookingCancelledEmail,
  renderBookingCreatedEmail,
  renderNewOfferEmail,
} from "./notification-emails";

describe("notification email templates", () => {
  it("escapes guide names before interpolating them into new-offer HTML", () => {
    const email = renderNewOfferEmail({
      guideName: `Иван <img src=x onerror="alert(1)"> & Ко`,
      requestUrl: "https://provodnik.app/requests/request-1",
    });

    expect(email.html).toContain(
      "Иван &lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; Ко",
    );
    expect(email.html).not.toContain("<img");
    expect(email.html).not.toContain(`onerror="alert(1)"`);
  });

  it("escapes dynamic hrefs before interpolating them into email HTML", () => {
    const email = renderBookingCreatedEmail({
      bookingUrl: `https://provodnik.app/bookings/1?next=" onclick="alert(1)`,
    });

    expect(email.html).toContain(
      `href="https://provodnik.app/bookings/1?next=&quot; onclick=&quot;alert(1)"`,
    );
    expect(email.html).not.toContain(`href="https://provodnik.app/bookings/1?next=" onclick=`);
  });

  it("escapes cancelled booking hrefs before interpolating them into email HTML", () => {
    const email = renderBookingCancelledEmail({
      bookingUrl: `https://provodnik.app/bookings/1?reason=<script>`,
    });

    expect(email.html).toContain(
      `href="https://provodnik.app/bookings/1?reason=&lt;script&gt;"`,
    );
    expect(email.html).not.toContain("<script>");
  });
});
