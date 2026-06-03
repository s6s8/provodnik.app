import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OpenRequestRecord } from "@/data/open-requests/types";

const reqCardProps: Array<{ title: string; desc?: string; fillPct?: number | null }> = [];

vi.mock("@/components/shared/req-card", () => ({
  ReqCard: (props: { title: string; desc?: string; fillPct?: number | null }) => {
    reqCardProps.push(props);
    return (
      <article data-fill-pct={String(props.fillPct)} data-testid="request-card">
        <h2>{props.title}</h2>
        {props.desc ? <p>{props.desc}</p> : null}
      </article>
    );
  },
}));

import { PublicRequestsMarketplaceScreen } from "./public-requests-marketplace-screen";

const baseRequest: OpenRequestRecord = {
  id: "open-request-1",
  status: "open",
  visibility: "public",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  travelerRequestId: "traveler-request-1",
  group: {
    sizeCurrent: 1,
    sizeTarget: 0,
    openToMoreMembers: false,
  },
  destinationLabel: "Элиста, Калмыкия",
  regionLabel: "Калмыкия",
  dateRangeLabel: "10 июня",
  highlights: ["Иволгинский дацан"],
  interests: ["history"],
};

describe("PublicRequestsMarketplaceScreen", () => {
  it("filters category pills by request interests", () => {
    render(<PublicRequestsMarketplaceScreen initialData={[baseRequest]} />);

    fireEvent.click(screen.getByRole("button", { name: "История" }));

    expect(screen.getByTestId("request-card")).toBeInTheDocument();
  });

  it("avoids NaN fill percent and falls back description when only one highlight exists", () => {
    reqCardProps.length = 0;

    render(<PublicRequestsMarketplaceScreen initialData={[baseRequest]} />);

    expect(reqCardProps[0]).toMatchObject({
      title: "Иволгинский дацан",
      desc: "Элиста, Калмыкия",
      fillPct: null,
    });
  });
});
