import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpSearch } from "./HelpSearch";

const articles = [
  {
    id: "article-1",
    slug: "booking",
    category: "general",
    title: "Как забронировать экскурсию",
    body_md: "Инструкция по бронированию",
    position: 1,
  },
];

describe("HelpSearch", () => {
  it("renders search results as a plain list of buttons", () => {
    Element.prototype.scrollIntoView = vi.fn();

    render(<HelpSearch articles={articles} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск по справке" }), {
      target: { value: "забронировать" },
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Как забронировать экскурсию" }),
    ).toBeInTheDocument();
  });
});
