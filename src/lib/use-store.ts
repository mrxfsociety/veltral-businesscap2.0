"use client";

import { useSyncExternalStore } from "react";
import { getServerSnapshot, readStore, subscribeStore } from "./store";

export function useStore() {
  return useSyncExternalStore(subscribeStore, readStore, getServerSnapshot);
}
