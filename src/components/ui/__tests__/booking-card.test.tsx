import { render } from "@testing-library/react"
import { ShieldCheck } from "lucide-react"
import { describe, expect, it } from "vitest"

import { BookingCard } from "../booking-card"

const normalize = (value: string | null) => (value ?? "").replace(/\s/g, " ")

describe("BookingCard", () => {
  it("formats the price with RU thousands and ₽, and renders the action", () => {
    const { container, getByText } = render(
      <BookingCard price={4500} action={<button>Забронировать</button>} />
    )

    expect(normalize(container.textContent)).toContain("4 500")
    expect(normalize(container.textContent)).toContain("₽")
    expect(getByText("Забронировать")).toBeTruthy()
  })

  it("renders the default eyebrow when none is provided", () => {
    const { container } = render(
      <BookingCard price={4500} action={<button>Забронировать</button>} />
    )
    const eyebrow = container.querySelector('[data-slot="badge"][data-variant="eyebrow"]')

    expect(eyebrow?.textContent).toBe("Бронирование")
  })

  it("renders a green-tint note block when note is provided", () => {
    const { container } = render(
      <BookingCard
        price={4500}
        note="Свободно ещё 2 места"
        action={<button>Забронировать</button>}
      />
    )
    const note = container.querySelector('[data-slot="booking-card-note"]')

    expect(note?.className).toContain("bg-green-tint")
    expect(note?.textContent).toBe("Свободно ещё 2 места")
  })

  it("renders an AvatarStack and label when momentum is provided", () => {
    const { container, getByText } = render(
      <BookingCard
        price={4500}
        momentum={{ avatarUrls: ["/a.jpg", "/b.jpg"], label: "уже присоединились" }}
        action={<button>Забронировать</button>}
      />
    )

    expect(
      container.querySelector('[data-slot="avatar-stack-item"]')
    ).toBeTruthy()
    expect(getByText("уже присоединились")).toBeTruthy()
  })

  it("renders trust lines with their icons", () => {
    const { container, getByText } = render(
      <BookingCard
        price={4500}
        trustLines={[{ icon: ShieldCheck, text: "Безопасная оплата" }]}
        action={<button>Забронировать</button>}
      />
    )

    expect(getByText("Безопасная оплата")).toBeTruthy()
    expect(container.querySelector("svg")).toBeTruthy()
  })
})
