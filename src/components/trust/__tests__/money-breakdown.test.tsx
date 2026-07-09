import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MoneyBreakdown } from "../money-breakdown";

describe("MoneyBreakdown", () => {
  it("renders the «Итого» total with ru-RU formatting and ₽", () => {
    const { getByText } = render(<MoneyBreakdown pricePerPerson={4500} partySize={3} />);

    expect(getByText("13 500 ₽")).not.toBeNull();
  });

  it("omits the «Депозит» row when depositMinor is undefined", () => {
    const { queryByText } = render(<MoneyBreakdown pricePerPerson={4500} partySize={3} />);

    expect(queryByText("Депозит")).toBeNull();
  });

  it("shows «Сервисный сбор» from platformFeeMinor", () => {
    const { getByText } = render(
      <MoneyBreakdown pricePerPerson={4500} partySize={3} platformFeeMinor={50000} />,
    );

    expect(getByText("Сервисный сбор")).not.toBeNull();
    expect(getByText("500 ₽")).not.toBeNull();
  });

  it("renders the platform prepayment note", () => {
    const { getByText } = render(<MoneyBreakdown pricePerPerson={4500} partySize={3} />);

    expect(getByText(/предоплату на платформе/)).not.toBeNull();
  });
});
