"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface ReviewPromptOverlayProps {
  guideName: string;
  bookingId: string;
  onDismiss: () => void;
}

export function ReviewPromptOverlay({
  guideName,
  bookingId,
  onDismiss,
}: ReviewPromptOverlayProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden
      />

      {/* Dialog */}
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-xl space-y-5">
        <div className="text-center space-y-2">
          <div className="text-4xl">🌟</div>
          <h2 className="text-lg font-semibold text-foreground">
            Как прошла поездка с {guideName}?
          </h2>
          <p className="text-sm text-muted-foreground">
            Ваш отзыв поможет другим путешественникам выбрать гида
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            asChild
            className="w-full"
          >
            <a href={`/traveler/bookings/${bookingId}/review`}>
              Оставить отзыв
            </a>
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleDismiss}
          >
            Позже
          </Button>
        </div>
      </div>
    </div>
  );
}
