import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GuideProfileSectionClientBoundary } from "./guide-profile-section-client-boundary";
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

  it("resets the client error boundary when the section id changes", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    function ThrowingSectionChild(): never {
      throw new Error("child render failed");
    }

    function Harness() {
      const [sectionId, setSectionId] = React.useState("verification");
      return (
        <>
          <button type="button" onClick={() => setSectionId("about")}>
            Сменить раздел
          </button>
          <GuideProfileSectionBoundary id={sectionId} title="Верификация">
            {() =>
              sectionId === "verification" ? (
                <ThrowingSectionChild />
              ) : (
                <p>Раздел восстановлен</p>
              )
            }
          </GuideProfileSectionBoundary>
        </>
      );
    }

    render(<Harness />);

    expect(
      screen.getByText("Раздел временно недоступен. Остальная часть профиля продолжает работать."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Сменить раздел" }));

    expect(screen.getByText("Раздел восстановлен")).toBeInTheDocument();
  });

  it("clears client boundary errors when sectionId changes without remounting", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    function ThrowingSectionChild(): never {
      throw new Error("child render failed");
    }

    const { rerender } = render(
      <GuideProfileSectionClientBoundary sectionId="verification" title="Верификация">
        <ThrowingSectionChild />
      </GuideProfileSectionClientBoundary>,
    );

    expect(
      screen.getByText("Раздел временно недоступен. Остальная часть профиля продолжает работать."),
    ).toBeInTheDocument();

    rerender(
      <GuideProfileSectionClientBoundary sectionId="about" title="О себе">
        <p>Раздел восстановлен</p>
      </GuideProfileSectionClientBoundary>,
    );

    expect(screen.getByText("Раздел восстановлен")).toBeInTheDocument();
  });
});
