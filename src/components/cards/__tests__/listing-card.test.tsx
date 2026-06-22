import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ListingCard } from "../listing-card"

describe("ListingCard", () => {
  it("renders a whole-card link to the listing slug with the title", () => {
    const { container, getByText } = render(
      <ListingCard
        listing={{
          id: "1",
          slug: "elbrus",
          title: "Эльбрус 3 дня",
          photoUrl: "/img.jpg",
        }}
      />
    )

    const link = container.querySelector('a[href="/listings/elbrus"]')
    expect(link).not.toBeNull()
    expect(getByText("Эльбрус 3 дня")).toBeTruthy()
  })

  it("shows the «Проверен» badge when the guide is verified", () => {
    const { getByText } = render(
      <ListingCard
        listing={{
          id: "1",
          slug: "elbrus",
          title: "Эльбрус 3 дня",
          photoUrl: "/img.jpg",
          guide: { name: "Айдар", verified: true },
        }}
      />
    )

    expect(getByText("Проверен")).toBeTruthy()
  })

  it("omits the rating row when rating is undefined", () => {
    const { container } = render(
      <ListingCard
        listing={{
          id: "1",
          slug: "elbrus",
          title: "Эльбрус 3 дня",
          photoUrl: "/img.jpg",
        }}
      />
    )

    expect(
      container.querySelector('[data-slot="listing-card-rating"]')
    ).toBeNull()
  })

  it("renders the rating row when rating is provided", () => {
    const { container } = render(
      <ListingCard
        listing={{
          id: "1",
          slug: "elbrus",
          title: "Эльбрус 3 дня",
          photoUrl: "/img.jpg",
          rating: 4.9,
          reviewCount: 12,
        }}
      />
    )

    expect(
      container.querySelector('[data-slot="listing-card-rating"]')
    ).not.toBeNull()
  })

  it("renders the price with RU formatting only when priceFrom is set", () => {
    const { container } = render(
      <ListingCard
        listing={{
          id: "1",
          slug: "elbrus",
          title: "Эльбрус 3 дня",
          photoUrl: "/img.jpg",
          priceFrom: 12000,
        }}
      />
    )

    const text = (container.textContent ?? "").replace(/\s/g, " ")
    expect(text).toContain("от 12 000 ₽")
  })

  it("does not nest an anchor inside the card link", () => {
    const { container } = render(
      <ListingCard
        listing={{
          id: "1",
          slug: "elbrus",
          title: "Эльбрус 3 дня",
          photoUrl: "/img.jpg",
          guide: { name: "Айдар", verified: true },
        }}
      />
    )

    expect(container.querySelectorAll("a")).toHaveLength(1)
  })
})
