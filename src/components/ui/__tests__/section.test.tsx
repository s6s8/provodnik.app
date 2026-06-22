import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Section } from "../section";

describe("Section", () => {
  it("wraps children in a centered container with horizontal padding", () => {
    const { container } = render(
      <Section title="Популярные маршруты">
        <div data-testid="content" />
      </Section>
    );
    const inner = container.querySelector("section > div");

    expect(inner?.className).toContain("container");
    expect(inner?.className).toContain("px-5");
  });

  it("applies the vertical rhythm to the section element", () => {
    const { container } = render(
      <Section>
        <div />
      </Section>
    );
    const section = container.querySelector("section");

    expect(section?.className).toContain("py-12");
  });

  it("renders the title as a bold heading", () => {
    const { getByText } = render(
      <Section title="Популярные маршруты">
        <div />
      </Section>
    );
    const title = getByText("Популярные маршруты");

    expect(title.className).toContain("font-bold");
  });

  it("renders subtitle and action when provided", () => {
    const { getByText } = render(
      <Section
        title="Маршруты"
        subtitle="Лучшее за месяц"
        action={<button type="button">Все</button>}
      >
        <div />
      </Section>
    );

    expect(getByText("Лучшее за месяц")).toBeTruthy();
    expect(getByText("Все")).toBeTruthy();
  });

  it("omits the header row when no title, subtitle or action", () => {
    const { container } = render(
      <Section>
        <div data-testid="content" />
      </Section>
    );
    const inner = container.querySelector("section > div");

    expect(inner?.querySelector("header")).toBeNull();
  });
});
