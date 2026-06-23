import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SeatProgressBar } from "../seat-progress-bar"

describe("SeatProgressBar", () => {
  it("renders a fill at 30% for taken=3, max=10", () => {
    const { container } = render(<SeatProgressBar taken={3} max={10} />)
    const fill = container.querySelector('[role="progressbar"]')

    expect(fill).toBeTruthy()
    expect((fill as HTMLElement).style.width).toBe("30%")
    expect(fill?.getAttribute("aria-valuenow")).toBe("3")
    expect(fill?.getAttribute("aria-valuemax")).toBe("10")
  })

  it("clamps the fill to 100% when taken exceeds max", () => {
    const { container } = render(<SeatProgressBar taken={15} max={10} />)
    const fill = container.querySelector('[role="progressbar"]')

    expect((fill as HTMLElement).style.width).toBe("100%")
  })

  it("renders RU plural participant text and no bar when max is null", () => {
    const { container, getByText } = render(
      <SeatProgressBar taken={4} max={null} />
    )

    expect(getByText("4 участника")).toBeTruthy()
    expect(container.querySelector(".h-2")).toBeNull()
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
  })
})
