import { render } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { Bell } from "lucide-react"
import { describe, expect, it } from "vitest"

import { NotificationItem } from "../notification-item"

const baseProps = {
  kind: "booking",
  icon: Bell,
  message: "Гид подтвердил вашу заявку",
  timestamp: "2 ч назад",
  href: "/notifications/1",
}

describe("NotificationItem", () => {
  it("marks unread items with the primary border and card background", () => {
    const { container } = render(
      <NotificationItem {...baseProps} isRead={false} />
    )
    const row = container.querySelector('[data-slot="notification-item"]')

    expect(row?.className).toContain("border-primary")
    expect(row?.className).toContain("bg-card")
  })

  it("marks read items with a transparent border and no primary border", () => {
    const { container } = render(
      <NotificationItem {...baseProps} isRead />
    )
    const row = container.querySelector('[data-slot="notification-item"]')

    expect(row?.className).toContain("border-transparent")
    expect(row?.className).not.toContain("border-primary")
  })

  it("wraps the item in a link pointing at href", () => {
    const { container } = render(
      <NotificationItem {...baseProps} href="/notifications/42" />
    )
    const link = container.querySelector("a")

    expect(link?.getAttribute("href")).toBe("/notifications/42")
  })

  it('declares the client boundary with "use client"', () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/shared/notification-item.tsx"),
      "utf8"
    )

    expect(source.trimStart().startsWith('"use client"')).toBe(true)
  })
})
