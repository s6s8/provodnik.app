import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FormStepSection } from "../form-step-section"

describe("FormStepSection", () => {
  it("renders the step number, title and children", () => {
    const { getByText } = render(
      <FormStepSection step={2} title="Детали поездки">
        <p>Содержимое шага</p>
      </FormStepSection>
    )

    expect(getByText("2")).toBeTruthy()
    expect(getByText("Детали поездки")).toBeTruthy()
    expect(getByText("Содержимое шага")).toBeTruthy()
  })
})
