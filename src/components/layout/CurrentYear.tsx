"use client";

import { useSyncExternalStore } from "react";

function subscribeToYearChanges() {
  return () => {};
}

export function CurrentYear() {
  const year = useSyncExternalStore(
    subscribeToYearChanges,
    () => new Date().getFullYear(),
    () => null,
  );

  return year ?? "";
}
