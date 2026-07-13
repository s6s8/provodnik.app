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

const groups = [{ id: "general", label: "Общее", articles }];

describe("HelpSearch", () => {
  it("renders search results as a plain list of buttons", () => {
    Element.prototype.scrollIntoView = vi.fn();

    render(<HelpSearch articles={articles} groups={groups} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск по справке" }), {
      target: { value: "забронировать" },
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    // Both the search hit and the (closed) accordion trigger carry the title.
    expect(
      screen.getAllByRole("button", { name: "Как забронировать экскурсию" }).length,
    ).toBeGreaterThan(0);
  });

  it("opens the matching accordion entry when a result is picked", () => {
    Element.prototype.scrollIntoView = vi.fn();

    render(<HelpSearch articles={articles} groups={groups} />);
    expect(screen.queryByText("Инструкция по бронированию")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск по справке" }), {
      target: { value: "забронировать" },
    });
    // The results dropdown renders before the accordion in the DOM.
    const [result] = screen.getAllByRole("button", { name: "Как забронировать экскурсию" });
    fireEvent.click(result);

    expect(screen.getByText("Инструкция по бронированию")).toBeInTheDocument();
  });
});
