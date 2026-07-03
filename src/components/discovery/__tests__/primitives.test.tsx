import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DestinationCard } from "../DestinationCard"
import { NewGuideFrame } from "../NewGuideFrame"

describe("DestinationCard", () => {
  it("renders the destination name and a link to its slug", () => {
    const { container, getByText } = render(
      <DestinationCard
        name="Самарканд"
        slug="samarkand"
        photoUrl="/samarkand.jpg"
        guidesCount={5}
        tourCount={12}
      />
    )

    expect(getByText("Самарканд")).toBeTruthy()
    expect(
      container.querySelector('a[href="/destinations/samarkand"]')
    ).toBeTruthy()
  })

  it("omits the rating when rating is null", () => {
    const { container } = render(
      <DestinationCard
        name="Самарканд"
        slug="samarkand"
        photoUrl="/samarkand.jpg"
        guidesCount={5}
        tourCount={12}
        rating={null}
      />
    )

    expect(
      container.querySelector('[data-slot="destination-rating"]')
    ).toBeNull()
    expect(container.textContent).not.toContain("★")
    expect(container.textContent).not.toContain("рейтинг")
  })

  it("renders the rating when a real number is passed", () => {
    const { container, getByText } = render(
      <DestinationCard
        name="Самарканд"
        slug="samarkand"
        photoUrl="/samarkand.jpg"
        guidesCount={5}
        tourCount={12}
        rating={4.8}
      />
    )

    expect(getByText("4.8")).toBeTruthy()
    expect(
      container.querySelector('[data-slot="destination-rating"]')
    ).toBeTruthy()
  })
})

describe("NewGuideFrame", () => {
  it("renders the cold-start label and the guide name", () => {
    const { container, getByText } = render(
      <NewGuideFrame guideName="Алишер" />
    )

    expect(getByText("Первые экскурсии")).toBeTruthy()
    expect(container.textContent).toContain("Алишер")
  })
})
