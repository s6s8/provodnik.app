import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AvatarStack } from "../avatar-stack";

describe("AvatarStack", () => {
  it("renders one circle per user", () => {
    const { container } = render(
      <AvatarStack users={[{ name: "Айдар" }, { name: "Рима" }]} />
    );
    const items = container.querySelectorAll('[data-slot="avatar-stack-item"]');

    expect(items).toHaveLength(2);
  });

  it("falls back to the uppercase initial when no avatarUrl", () => {
    const { getByText } = render(<AvatarStack users={[{ name: "айдар" }]} />);

    expect(getByText("А")).toBeTruthy();
  });

  it("renders an image when avatarUrl is provided", () => {
    const { container } = render(
      <AvatarStack users={[{ name: "Айдар", avatarUrl: "/a.jpg" }]} />
    );
    const img = container.querySelector("img");

    expect(img?.getAttribute("src")).toBe("/a.jpg");
    expect(img?.getAttribute("alt")).toBe("Айдар");
  });

  it("clamps to max and renders an overflow badge", () => {
    const { container, getByText } = render(
      <AvatarStack users={[{ name: "Айдар" }, { name: "Рима" }]} max={1} />
    );
    const items = container.querySelectorAll('[data-slot="avatar-stack-item"]');

    expect(items).toHaveLength(1);
    expect(getByText("+1")).toBeTruthy();
  });
});
