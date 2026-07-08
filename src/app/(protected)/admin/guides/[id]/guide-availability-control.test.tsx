import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./actions", () => ({ setGuideAvailability: vi.fn() }));

import { GuideAvailabilityControl } from "./guide-availability-control";

describe("GuideAvailabilityControl", () => {
  it("labels the override for an available guide", () => {
    render(<GuideAvailabilityControl guideId="g1" available={true} />);
    expect(
      screen.getByRole("button", { name: /приостановить/i }),
    ).toBeInTheDocument();
  });

  it("labels the override for a paused guide", () => {
    render(<GuideAvailabilityControl guideId="g1" available={false} />);
    expect(
      screen.getByRole("button", { name: /возобновить/i }),
    ).toBeInTheDocument();
  });
});
