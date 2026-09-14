"use client";

import { useEffect } from "react";

/** Blocca lo scroll del documento nella dashboard: scorre solo il contenuto a destra. */
export function LockDashboardScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    html.classList.add("dashboard-shell");
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    return () => {
      html.classList.remove("dashboard-shell");
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      html.style.height = previous.htmlHeight;
      body.style.height = previous.bodyHeight;
      html.style.overscrollBehavior = previous.htmlOverscroll;
      body.style.overscrollBehavior = previous.bodyOverscroll;
    };
  }, []);

  return null;
}
