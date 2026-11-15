"use client";
import { useSyncExternalStore } from "react";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("ftp-storage", listener);
  window.addEventListener("ftp-cart-updated", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("ftp-storage", listener);
    window.removeEventListener("ftp-cart-updated", listener);
  };
}
export function useBrowserStorage(key: string) {
  return useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(key); } catch { return null; }
  }, () => null);
}
const emptySubscribe = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
