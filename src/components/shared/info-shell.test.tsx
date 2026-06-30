import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfoHero, InfoPageShell, InfoSection } from "./info-shell";

describe("InfoHero", () => {
  it("renders the title as H1 with optional eyebrow, subtitle and actions", () => {
    render(
      <InfoHero
        eyebrow="Поддержка"
        title="Центр помощи"
        subtitle="Ответы на частые вопросы"
        actions={<button type="button">Написать</button>}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Центр помощи" })).toBeInTheDocument();
    expect(screen.getByText("Поддержка")).toBeInTheDocument();
    expect(screen.getByText("Ответы на частые вопросы")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Написать" })).toBeInTheDocument();
  });

  it("omits eyebrow and actions when not provided", () => {
    render(<InfoHero title="Как это работает" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("InfoPageShell", () => {
  it("defaults to the prose width and supports a wider help column", () => {
    const { container, rerender } = render(<InfoPageShell>body</InfoPageShell>);
    expect((container.firstElementChild as HTMLElement).className).toContain("max-w-2xl");

    rerender(<InfoPageShell width="wide">body</InfoPageShell>);
    expect((container.firstElementChild as HTMLElement).className).toContain("max-w-3xl");
  });
});

describe("InfoSection", () => {
  it("renders an optional section heading", () => {
    render(<InfoSection title="Запрос гидам">content</InfoSection>);
    expect(screen.getByRole("heading", { level: 2, name: "Запрос гидам" })).toBeInTheDocument();
  });
});
