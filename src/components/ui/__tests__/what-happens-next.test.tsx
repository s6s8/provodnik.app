import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { WhatHappensNext } from "../what-happens-next"

describe("WhatHappensNext", () => {
  it("renders all three steps by default", () => {
    const { getByText } = render(<WhatHappensNext />)

    expect(getByText("Проверенные местные гиды видят ваш запрос")).toBeTruthy()
    expect(getByText("Персональные предложения приходят вам")).toBeTruthy()
    expect(getByText("Вы выбираете гида и детали поездки")).toBeTruthy()
  })

  it("renders the success header in the confirmation variant", () => {
    const { getByText } = render(<WhatHappensNext variant="confirmation" />)

    expect(getByText("Запрос отправлен")).toBeTruthy()
  })
})
