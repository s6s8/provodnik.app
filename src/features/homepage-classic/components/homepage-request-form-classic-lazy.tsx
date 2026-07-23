"use client";

import { useEffect, useState, type ComponentType } from "react";

import type { DestinationOption } from "@/data/supabase/queries";

import { HomepageRequestFormClassicSkeleton } from "./homepage-request-form-classic-skeleton";
import type { TemplateRequestPrefill } from "./template-request-prefill";

type FormProps = {
  destinations: DestinationOption[];
  preferredGuide?: { slug: string; name: string; templateId?: string | null } | null;
  templatePrefill?: TemplateRequestPrefill | null;
};

/**
 * Defers the heavy request-form bundle until the browser is idle so header
 * links and catalog cards stay responsive on first paint.
 */
export function HomepageRequestFormClassic(props: FormProps) {
  const [Form, setForm] = useState<ComponentType<FormProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void import("./homepage-request-form-classic").then((module) => {
        if (!cancelled) setForm(() => module.HomepageRequestFormClassic);
      });
    };

    const scheduleLoad = () => {
      if ("requestIdleCallback" in globalThis) {
        const id = globalThis.requestIdleCallback(load, { timeout: 1_500 });
        return () => {
          cancelled = true;
          globalThis.cancelIdleCallback(id);
        };
      }

      const timer = globalThis.setTimeout(load, 0);
      return () => {
        cancelled = true;
        globalThis.clearTimeout(timer);
      };
    };

    return scheduleLoad();
  }, []);

  if (!Form) return <HomepageRequestFormClassicSkeleton />;
  return <Form {...props} />;
}
