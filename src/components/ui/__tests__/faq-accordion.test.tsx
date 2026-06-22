import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqAccordion } from "../faq-accordion";

const items = [
  { question: "Как записаться?", answer: "Просто оставьте запрос." },
];

describe("FaqAccordion", () => {
  it("renders the question and a ChevronDown svg (not a glyph)", () => {
    const { container, getByText } = render(<FaqAccordion items={items} />);

    expect(getByText("Как записаться?")).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.textContent).not.toContain("+");
    expect(container.textContent).not.toContain("▾");
  });

  it("gives each trigger a ≥44px touch target and aria-expanded", () => {
    const { getByRole } = render(<FaqAccordion items={items} />);
    const trigger = getByRole("button", { name: /Как записаться\?/ });

    expect(trigger.className).toContain("min-h-[44px]");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles the answer open on click", () => {
    const { getByRole, queryByText } = render(<FaqAccordion items={items} />);
    const trigger = getByRole("button", { name: /Как записаться\?/ });

    expect(queryByText("Просто оставьте запрос.")).toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(queryByText("Просто оставьте запрос.")).toBeTruthy();
  });
});
