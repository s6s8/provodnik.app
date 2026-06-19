import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Мои заявки" />);

    expect(screen.getByRole("heading", { name: "Мои заявки" })).toBeInTheDocument();
  });

  it("renders eyebrow, subtitle and actions when provided", () => {
    render(
      <PageHeader
        eyebrow="Кабинет"
        title="Мои заявки"
        subtitle="Здесь собраны ваши запросы."
        actions={<button type="button">Создать</button>}
      />,
    );

    expect(screen.getByText("Кабинет")).toBeInTheDocument();
    expect(screen.getByText("Здесь собраны ваши запросы.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Создать" })).toBeInTheDocument();
  });

  it("omits eyebrow, subtitle and actions when not provided", () => {
    render(<PageHeader title="Мои заявки" />);

    expect(screen.queryByText("Кабинет")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
