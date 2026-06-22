import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { GuideCard } from "../guide-card"

describe("GuideCard", () => {
  it("always renders the guide name and a whole-card link", () => {
    const { container, getByText } = render(
      <GuideCard guide={{ slug: "aidar", name: "Айдар Беков" }} />
    )

    expect(getByText("Айдар Беков")).toBeTruthy()
    expect(container.querySelector('a[href="/guides/aidar"]')).not.toBeNull()
    expect(container.querySelectorAll("a")).toHaveLength(1)
  })

  it("shows the «Проверен» badge when verified", () => {
    const { getByText } = render(
      <GuideCard
        guide={{ slug: "aidar", name: "Айдар Беков", verified: true }}
      />
    )

    expect(getByText("Проверен")).toBeTruthy()
  })

  it("renders «—» in the StatStrip for a null responseRate", () => {
    const { container } = render(
      <GuideCard
        guide={{
          slug: "aidar",
          name: "Айдар Беков",
          experienceYears: 5,
          tripsCompleted: 40,
          listingCount: 8,
        }}
      />
    )

    const text = container.textContent ?? ""
    expect(text).toContain("—")
    expect(text).toContain("% ответов")
  })

  it("renders the price only when priceFrom is set", () => {
    const { container } = render(
      <GuideCard
        guide={{ slug: "aidar", name: "Айдар Беков", priceFrom: 9000 }}
      />
    )

    expect((container.textContent ?? "").replace(/\s/g, " ")).toContain(
      "от 9 000 ₽"
    )
  })

  it("renders the CTA as a non-link span (no nested anchor)", () => {
    const { getByText } = render(
      <GuideCard guide={{ slug: "aidar", name: "Айдар Беков" }} />
    )

    const cta = getByText("Смотреть маршруты")
    expect(cta.tagName).toBe("SPAN")
  })
})
