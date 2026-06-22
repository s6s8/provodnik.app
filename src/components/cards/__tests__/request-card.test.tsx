import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RequestCard } from "../request-card"

describe("RequestCard", () => {
  it("renders a whole-card link to the request id", () => {
    const { container } = render(
      <RequestCard
        request={{ id: "1", destination: "Эльбрус", dates: "5–7 июля" }}
      />
    )

    expect(container.querySelector('a[href="/requests/1"]')).not.toBeNull()
    expect(container.querySelectorAll("a")).toHaveLength(1)
  })

  it("renders offerCount as-is even when it is 0 (real value, not omitted)", () => {
    const { container } = render(
      <RequestCard
        request={{
          id: "1",
          destination: "Эльбрус",
          dates: "5–7 июля",
          offerCount: 0,
        }}
      />
    )

    expect((container.textContent ?? "")).toContain("0 предложений")
  })

  it("renders a green-tint Tag for an open format", () => {
    const { container } = render(
      <RequestCard
        request={{
          id: "1",
          destination: "Эльбрус",
          dates: "5–7 июля",
          format: "open",
        }}
      />
    )

    const tag = container.querySelector('[data-slot="tag"]')
    expect(tag?.className).toContain("bg-green-tint")
  })

  it("renders a primary-tint Tag for a private format", () => {
    const { container } = render(
      <RequestCard
        request={{
          id: "1",
          destination: "Эльбрус",
          dates: "5–7 июля",
          format: "private",
        }}
      />
    )

    const tag = container.querySelector('[data-slot="tag"]')
    expect(tag?.className).toContain("bg-primary-tint")
  })

  it("renders an AvatarStack when memberAvatars are provided", () => {
    const { container } = render(
      <RequestCard
        request={{
          id: "1",
          destination: "Эльбрус",
          dates: "5–7 июля",
          memberAvatars: ["/a.jpg", "/b.jpg"],
        }}
      />
    )

    expect(
      container.querySelector('[data-slot="avatar-stack-item"]')
    ).not.toBeNull()
  })

  it("omits offerCount text when offerCount is undefined", () => {
    const { container } = render(
      <RequestCard
        request={{ id: "1", destination: "Эльбрус", dates: "5–7 июля" }}
      />
    )

    expect((container.textContent ?? "")).not.toContain("предложений")
  })
})
