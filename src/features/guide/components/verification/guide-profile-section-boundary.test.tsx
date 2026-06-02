import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GuideProfileSectionBoundary } from "./guide-profile-section-boundary";

describe("GuideProfileSectionBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a section fallback while sibling sections remain visible", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <div>
        <GuideProfileSectionBoundary id="about" title="О себе">
          {() => <p>Блок о гиде доступен</p>}
        </GuideProfileSectionBoundary>
        <GuideProfileSectionBoundary id="legal" title="Юридические данные">
          {() => {
            throw new Error("legal section failed");
          }}
        </GuideProfileSectionBoundary>
        <GuideProfileSectionBoundary id="verification" title="Верификация">
          {() => <button type="button">Отправить на проверку</button>}
        </GuideProfileSectionBoundary>
      </div>,
    );

    expect(screen.getByText("Блок о гиде доступен")).toBeInTheDocument();
    expect(document.getElementById("about")).toHaveClass(
      "scroll-mt-[calc(var(--nav-h)+1rem)]",
    );
    expect(
      screen.getByRole("button", { name: "Отправить на проверку" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Юридические данные")).toBeInTheDocument();
    expect(
      screen.getByText("Раздел временно недоступен. Остальная часть профиля продолжает работать."),
    ).toBeInTheDocument();
  });

  it("catches errors thrown by a section child during render", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    function ThrowingSectionChild(): never {
      throw new Error("child render failed");
    }

    render(
      <div>
        <GuideProfileSectionBoundary id="avatar" title="Фото">
          {() => <p>Фото доступно</p>}
        </GuideProfileSectionBoundary>
        <GuideProfileSectionBoundary id="verification" title="Верификация">
          {() => <ThrowingSectionChild />}
        </GuideProfileSectionBoundary>
      </div>,
    );

    expect(screen.getByText("Фото доступно")).toBeInTheDocument();
    expect(screen.getByText("Верификация")).toBeInTheDocument();
    expect(
      screen.getByText("Раздел временно недоступен. Остальная часть профиля продолжает работать."),
    ).toBeInTheDocument();
  });
});
