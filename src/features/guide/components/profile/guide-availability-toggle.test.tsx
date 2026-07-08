import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/features/guide/actions/setAvailability", () => ({
  setGuideAvailabilityAction: vi.fn(async () => ({ ok: true })),
}));

import { GuideAvailabilityToggle } from "./guide-availability-toggle";

describe("GuideAvailabilityToggle", () => {
  it("shows 'paused' affordance when currently available", () => {
    render(<GuideAvailabilityToggle available={true} />);
    expect(
      screen.getByRole("button", { name: /приостановить/i }),
    ).toBeInTheDocument();
  });

  it("shows 'resume' affordance when currently paused", () => {
    render(<GuideAvailabilityToggle available={false} />);
    expect(
      screen.getByRole("button", { name: /возобновить/i }),
    ).toBeInTheDocument();
  });
});
