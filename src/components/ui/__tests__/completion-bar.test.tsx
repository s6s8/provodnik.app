import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CompletionBar } from "../completion-bar"

describe("CompletionBar", () => {
  it("renders a fill with the inline width and a muted track", () => {
    const { container, getByText } = render(
      <CompletionBar completionPct={60} label="60% заполнено" />
    )
    const track = container.querySelector('[data-slot="completion-bar-track"]')
    const fill = container.querySelector('[data-slot="completion-bar-fill"]')

    expect(track?.className).toContain("bg-muted")
    expect(fill).toBeTruthy()
    expect((fill as HTMLElement).style.width).toBe("60%")
    expect(getByText("60% заполнено")).toBeTruthy()
  })

  it("clamps out-of-range values to 0–100", () => {
    const { container, rerender } = render(<CompletionBar completionPct={140} />)
    let fill = container.querySelector('[data-slot="completion-bar-fill"]')

    expect((fill as HTMLElement).style.width).toBe("100%")

    rerender(<CompletionBar completionPct={-20} />)
    fill = container.querySelector('[data-slot="completion-bar-fill"]')
    expect((fill as HTMLElement).style.width).toBe("0%")
  })
})
