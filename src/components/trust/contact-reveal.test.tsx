import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactReveal } from "./contact-reveal";

const guide = { name: "QA Guide" };

describe("ContactReveal", () => {
  it("shows the phone when contact is present on a confirmed booking", () => {
    render(
      <ContactReveal
        guide={guide}
        contact={{ phone: "+7 900 000-00-00" }}
        bookingStatus="confirmed"
      />,
    );
    expect(screen.getByText("+7 900 000-00-00")).toBeInTheDocument();
  });

  it("says the contact is not on file when confirmed but no phone and no error", () => {
    render(<ContactReveal guide={guide} contact={{}} bookingStatus="confirmed" />);
    expect(screen.getByText("Гид ещё не указал контакты")).toBeInTheDocument();
    expect(
      screen.queryByText("Не удалось загрузить контакты"),
    ).not.toBeInTheDocument();
  });

  it("shows the load-error copy only when the fetch actually failed", () => {
    render(
      <ContactReveal
        guide={guide}
        contact={{}}
        bookingStatus="confirmed"
        contactError
      />,
    );
    expect(screen.getByText("Не удалось загрузить контакты")).toBeInTheDocument();
    expect(
      screen.queryByText("Гид ещё не указал контакты"),
    ).not.toBeInTheDocument();
  });
});
