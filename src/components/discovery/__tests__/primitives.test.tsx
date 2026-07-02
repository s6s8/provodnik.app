import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DestinationCard } from "../DestinationCard"
import { FilterBar } from "../FilterBar"
import { IdentityRevealCard } from "../IdentityRevealCard"
import { NewGuideFrame } from "../NewGuideFrame"
import { SearchInput } from "../SearchInput"
import { StatStrip } from "../StatStrip"
import { TrustRibbon } from "../TrustRibbon"

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

describe("StatStrip", () => {
  it("renders the three counts with their labels", () => {
    const { container } = render(
      <StatStrip guides={12} tours={34} activeGroups={3} />
    )

    expect(container.textContent).toContain("12")
    expect(container.textContent).toContain("34")
    expect(container.textContent).toContain("3")
    // Counts use Russian plural agreement: 12 → "гидов", 34 → "экскурсии",
    // 3 → "активные группы".
    expect(container.textContent).toContain("гидов")
    expect(container.textContent).toContain("экскурсии")
    expect(container.textContent).toContain("активные группы")
  })

  it("never renders literal null/undefined, even with all zeros", () => {
    const { container } = render(
      <StatStrip guides={0} tours={0} activeGroups={0} />
    )

    expect(container.textContent).not.toContain("null")
    expect(container.textContent).not.toContain("undefined")
    expect(container.textContent).toContain("0")
  })
})

describe("IdentityRevealCard", () => {
  it("renders the name, verified badge and rating, never contact details", () => {
    const { container, getByText } = render(
      <IdentityRevealCard
        name="Дилноза"
        avatarUrl={null}
        verified={true}
        rating={4.9}
        reviewCount={20}
        tripsCompleted={15}
        recommendPct={98}
      />
    )

    expect(getByText("Дилноза")).toBeTruthy()
    expect(getByText("Проверен")).toBeTruthy()
    expect(container.textContent).toContain("4.9")
    expect(container.textContent).not.toContain("+7")
    expect(container.textContent).not.toContain("телефон")
    expect(container.textContent).not.toContain("telegram")
  })

  it("omits the rating when rating is null and the badge when not verified", () => {
    const { container, queryByText } = render(
      <IdentityRevealCard
        name="Дилноза"
        avatarUrl={null}
        verified={false}
        rating={null}
        reviewCount={0}
        tripsCompleted={0}
        recommendPct={null}
      />
    )

    expect(
      container.querySelector('[data-slot="identity-rating"]')
    ).toBeNull()
    expect(queryByText("Проверен")).toBeNull()
    expect(container.textContent).not.toContain("рекомендуют")
  })
})

describe("SearchInput", () => {
  it("renders the default placeholder and submits the value on Enter", () => {
    const onSubmit = vi.fn()
    const { container, getByPlaceholderText } = render(
      <SearchInput value="Бухара" onChange={() => {}} onSubmit={onSubmit} />
    )

    expect(getByPlaceholderText("Куда вы хотите поехать?")).toBeTruthy()

    const form = container.querySelector("form")
    expect(form).toBeTruthy()
    fireEvent.submit(form as HTMLFormElement)
    expect(onSubmit).toHaveBeenCalledWith("Бухара")
  })
})

describe("FilterBar", () => {
  it("renders chip labels and toggles on click", () => {
    const onToggle = vi.fn()
    const { getByText } = render(
      <FilterBar
        chips={[
          { id: "city", label: "Город" },
          { id: "nature", label: "Природа" },
        ]}
        activeIds={["city"]}
        onToggle={onToggle}
      />
    )

    const chip = getByText("Природа")
    expect(chip).toBeTruthy()
    fireEvent.click(chip)
    expect(onToggle).toHaveBeenCalledWith("nature")
  })
})

describe("TrustRibbon", () => {
  it("renders the default trust signals", () => {
    const { getByText } = render(<TrustRibbon />)

    expect(getByText("Проверенные гиды")).toBeTruthy()
    expect(getByText("Оплата при встрече")).toBeTruthy()
    expect(getByText("Поддержка 24/7")).toBeTruthy()
  })
})
