import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ListingTariffRow } from "@/lib/supabase/types";

import { TariffsList } from "./TariffsList";

const tariff = (overrides: Partial<ListingTariffRow> = {}): ListingTariffRow => ({
  id: "t-1",
  listing_id: "l-1",
  label: "Базовый",
  price_minor: 1_200_000,
  currency: "RUB",
  min_persons: 1,
  max_persons: 5,
  ...overrides,
});

describe("TariffsList rows", () => {
  it("prints «за группу до N человек» for a private RUB tariff, scoped to its own max_persons", () => {
    render(<TariffsList tariffs={[tariff({ max_persons: 4 })]} priceFromMinor={0} defaultCurrency="RUB" format="private" />);
    expect(screen.getByText("от 12 000 ₽ за группу до 4 человек")).toBeInTheDocument();
  });

  it("prints «за одного» for a group RUB tariff", () => {
    render(<TariffsList tariffs={[tariff()]} priceFromMinor={0} defaultCurrency="RUB" format="group" />);
    expect(screen.getByText("от 12 000 ₽ за одного")).toBeInTheDocument();
  });

  it("prints «за одного» for a combo RUB tariff", () => {
    render(<TariffsList tariffs={[tariff()]} priceFromMinor={0} defaultCurrency="RUB" format="combo" />);
    expect(screen.getByText("от 12 000 ₽ за одного")).toBeInTheDocument();
  });

  it("keeps a non-RUB tariff as bare «<amount> <code>» without a fabricated ₽ label", () => {
    render(
      <TariffsList tariffs={[tariff({ currency: "USD", price_minor: 15_000 })]} priceFromMinor={0} defaultCurrency="RUB" format="private" />,
    );
    expect(screen.getByText("150 USD")).toBeInTheDocument();
    expect(screen.queryByText(/за группу/)).not.toBeInTheDocument();
  });

  it("falls back to defaultCurrency when the row currency is null", () => {
    render(<TariffsList tariffs={[tariff({ currency: null })]} priceFromMinor={0} defaultCurrency="RUB" format="private" />);
    expect(screen.getByText("от 12 000 ₽ за группу до 5 человек")).toBeInTheDocument();
  });

  it("falls back to listing-wide maxGroupSize when a private tier has no max_persons", () => {
    render(
      <TariffsList tariffs={[tariff({ max_persons: null })]} priceFromMinor={0} defaultCurrency="RUB" format="private" maxGroupSize={8} />,
    );
    expect(screen.getByText("от 12 000 ₽ за группу до 8 человек")).toBeInTheDocument();
  });

  it("prefers the tier's own max_persons over the listing-wide maxGroupSize", () => {
    render(
      <TariffsList tariffs={[tariff({ max_persons: 3 })]} priceFromMinor={0} defaultCurrency="RUB" format="private" maxGroupSize={8} />,
    );
    expect(screen.getByText("от 12 000 ₽ за группу до 3 человек")).toBeInTheDocument();
  });
});
