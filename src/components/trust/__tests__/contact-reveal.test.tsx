import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { ContactReveal } from "../contact-reveal";

const guide = { name: "Аслан", verified: true };

describe("ContactReveal", () => {
  it("shows the guide name and gates contacts while pending", () => {
    const { getByText, container } = render(
      <ContactReveal guide={guide} contact={{ phone: "+79990001122" }} bookingStatus="pending" />,
    );

    expect(getByText("Аслан")).not.toBeNull();
    expect(getByText(/после подтверждения/)).not.toBeNull();
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it("reveals a tel: link when confirmed with a phone", () => {
    const { container } = render(
      <ContactReveal guide={guide} contact={{ phone: "+79990001122" }} bookingStatus="confirmed" />,
    );

    const tel = container.querySelector('a[href="tel:+79990001122"]');
    expect(tel).not.toBeNull();
  });

  it("shows an info Alert (not a false error) when confirmed but no contact and no load error", () => {
    const { container, getByText, queryByText } = render(
      <ContactReveal guide={guide} bookingStatus="confirmed" />,
    );

    expect(container.querySelector('[data-slot="alert"]')).not.toBeNull();
    expect(getByText("Гид ещё не указал контакты")).not.toBeNull();
    expect(queryByText("Не удалось загрузить контакты")).toBeNull();
  });

  it("shows the destructive load-error Alert only when the fetch actually failed", () => {
    const { getByText } = render(
      <ContactReveal guide={guide} bookingStatus="confirmed" contactError />,
    );

    expect(getByText("Не удалось загрузить контакты")).not.toBeNull();
  });

  it('declares the client boundary with "use client"', () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/trust/contact-reveal.tsx"),
      "utf8",
    );

    expect(source.trimStart().startsWith('"use client"')).toBe(true);
  });
});
