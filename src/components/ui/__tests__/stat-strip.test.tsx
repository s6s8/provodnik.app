import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StatStrip } from "../stat-strip"

describe("StatStrip", () => {
  it("renders values inline, null as an em dash, with a separator", () => {
    const { container, getByText } = render(
      <StatStrip
        stats={[
          { label: "гидов", value: 12 },
          { label: "туров", value: null },
        ]}
      />
    )

    expect(getByText("12")).toBeTruthy()
    expect(getByText("—")).toBeTruthy()
    expect(container.firstElementChild?.className).toContain("flex")
    expect(container.textContent).toContain("·")
  })

  it("does not render a separator after the last item", () => {
    const { container } = render(
      <StatStrip stats={[{ label: "гидов", value: 5 }]} />
    )

    expect(container.textContent).not.toContain("·")
  })

  it("renders 0 as 0, not an em dash", () => {
    const { container } = render(
      <StatStrip stats={[{ label: "туров", value: 0 }]} />
    )

    expect(container.textContent).toContain("0")
    expect(container.textContent).not.toContain("—")
  })
})
