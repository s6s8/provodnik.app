import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SharePageButton } from "./share-page-button";

const ORIGINAL_SHARE = Object.getOwnPropertyDescriptor(navigator, "share");

function setShare(value: unknown) {
  Object.defineProperty(navigator, "share", { value, configurable: true, writable: true });
}

afterEach(() => {
  vi.restoreAllMocks();
  if (ORIGINAL_SHARE) Object.defineProperty(navigator, "share", ORIGINAL_SHARE);
  else Reflect.deleteProperty(navigator, "share");
});

describe("SharePageButton", () => {
  it("is a labelled button, not a link to a made-up account", () => {
    setShare(undefined);
    render(<SharePageButton />);

    const button = screen.getByRole("button", { name: "Поделиться страницей" });
    expect(button.tagName).toBe("BUTTON");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("uses the native share sheet when the device has one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    render(<SharePageButton />);

    fireEvent.click(screen.getByRole("button", { name: "Поделиться страницей" }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0][0]).toMatchObject({ url: window.location.href });
  });

  it("falls back to copying the link when there is no share sheet", async () => {
    setShare(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<SharePageButton />);
    fireEvent.click(screen.getByRole("button", { name: "Поделиться страницей" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(window.location.href));
    // Feedback without a toast system: the label reports what happened.
    expect(await screen.findByText("Ссылка скопирована")).toBeInTheDocument();
  });

  it("does not leave the user thinking it copied when the clipboard is blocked", async () => {
    setShare(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });

    render(<SharePageButton />);
    fireEvent.click(screen.getByRole("button", { name: "Поделиться страницей" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Поделиться страницей" })).toBeInTheDocument(),
    );
    expect(screen.queryByText("Ссылка скопирована")).toBeNull();
  });

  it("stays quiet when the user dismisses the native share sheet", async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error("cancel"), { name: "AbortError" }));
    setShare(share);
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<SharePageButton />);
    fireEvent.click(screen.getByRole("button", { name: "Поделиться страницей" }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    // A dismissed sheet is not a failure — it must not silently copy instead.
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText("Ссылка скопирована")).toBeNull();
  });
});
