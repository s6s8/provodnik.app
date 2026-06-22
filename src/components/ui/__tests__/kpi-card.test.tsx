import { render } from "@testing-library/react"
import { TrendingUp } from "lucide-react"
import { describe, expect, it } from "vitest"

import { KpiCard } from "../kpi-card"

describe("KpiCard", () => {
  it("renders the value, a tinted icon circle and a muted label", () => {
    const { container, getByText } = render(
      <KpiCard value="42" icon={TrendingUp} label="Туров" />
    )
    const value = getByText("42")
    const iconCircle = container.querySelector('[data-slot="kpi-card-icon"]')
    const label = getByText("Туров")

    expect(value.className).toContain("font-extrabold")
    expect(iconCircle?.className).toContain("bg-primary-tint")
    expect(iconCircle?.querySelector("svg")).toBeTruthy()
    expect(label.className).toContain("text-muted-foreground")
  })

  it("renders no delta badge when delta is absent", () => {
    const { container } = render(
      <KpiCard value="42" icon={TrendingUp} label="Туров" />
    )

    expect(container.querySelector('[data-slot="badge"]')).toBeNull()
  })

  it("renders a success delta badge when delta is provided", () => {
    const { container, getByText } = render(
      <KpiCard value="42" icon={TrendingUp} label="Туров" delta="+12%" />
    )
    const badge = container.querySelector('[data-slot="badge"]')

    expect(badge).toBeTruthy()
    expect(badge?.getAttribute("data-variant")).toBe("success")
    expect(getByText("+12%")).toBeTruthy()
  })
})
