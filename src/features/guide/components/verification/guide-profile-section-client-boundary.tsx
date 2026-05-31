"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GuideProfileSectionClientBoundaryProps = {
  sectionId: string;
  title: string;
  children: ReactNode;
};

type GuideProfileSectionClientBoundaryState = {
  hasError: boolean;
};

function GuideProfileSectionFallback({ title }: { title: string }) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Раздел временно недоступен. Остальная часть профиля продолжает работать.
        </p>
      </CardContent>
    </Card>
  );
}

export class GuideProfileSectionClientBoundary extends Component<
  GuideProfileSectionClientBoundaryProps,
  GuideProfileSectionClientBoundaryState
> {
  state: GuideProfileSectionClientBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GuideProfileSectionClientBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[GuideProfileSectionBoundary] ${this.props.sectionId} failed:`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      return <GuideProfileSectionFallback title={this.props.title} />;
    }

    return this.props.children;
  }
}

export { GuideProfileSectionFallback };
