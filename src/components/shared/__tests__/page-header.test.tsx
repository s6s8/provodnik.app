import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "../page-header";

describe("PageHeader", () => {
  it("renders the eyebrow as a Badge variant=eyebrow (not a raw uppercase div)", () => {
    const { container, getByText } = render(
      <PageHeader eyebrow="Маршрут" title="Эльбрус" actions={<button>Действие</button>} />,
    );

    const eyebrow = container.querySelector('[data-slot="badge"][data-variant="eyebrow"]');
    expect(eyebrow).not.toBeNull();
    expect(eyebrow?.textContent).toBe("Маршрут");

    expect(getByText("Эльбрус").tagName).toBe("H1");
    expect(getByText("Действие")).not.toBeNull();
  });
});
