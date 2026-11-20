"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const targets = "h1, h2, h3, p, figure, article, img, .card, .body-md, .body-sm, [data-reveal]";
const excluded = 'form, dialog, [role="dialog"], [aria-live], [aria-hidden="true"], [hidden], [data-reveal="off"], .admin-shell, .tour-booking-form, .reservation-summary, .quick-booking';

function entrance(element: HTMLElement): { kind: string; frames: Keyframe[]; duration: number } {
  if (element.matches(".uppercase-tag, .micro-label")) {
    return {
      kind: "eyebrow", duration: 580,
      frames: [{ opacity: 0, translate: "0 14px" }, { opacity: 1, translate: "0 0" }],
    };
  }
  if (element.matches("h1, h2, h3")) {
    return {
      kind: "heading", duration: 820,
      frames: [
        { opacity: 0, translate: "0 30px", clipPath: "inset(0 0 100% 0)", filter: "blur(4px)" },
        { opacity: 1, translate: "0 0", clipPath: "inset(-15% -3% -20% -3%)", filter: "blur(0px)" },
      ],
    };
  }
  if (element.matches("img, figure")) {
    return {
      kind: "image", duration: 940,
      frames: [
        { opacity: 0, translate: "0 24px", scale: "1.035", clipPath: "inset(8% 0 0 0)" },
        { opacity: 1, translate: "0 0", scale: "1", clipPath: "inset(0 0 0 0)" },
      ],
    };
  }
  if (element.matches("article, .card")) {
    return {
      kind: "card", duration: 780,
      frames: [
        { opacity: 0, translate: "0 34px", scale: "0.97" },
        { opacity: 1, translate: "0 0", scale: "1" },
      ],
    };
  }
  return {
    kind: "text", duration: 680,
    frames: [
      { opacity: 0, translate: "0 22px", filter: "blur(2px)" },
      { opacity: 1, translate: "0 0", filter: "blur(0px)" },
    ],
  };
}

/** Animation effects never add attributes, wrappers or inline styles to React's HTML. */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname === "/accesso") return;
    if (!("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;
    const main = document.getElementById("contenuto");
    if (!main) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Map<HTMLElement, Animation>();
    const seen = new WeakSet<HTMLElement>();
    const enrolled = new WeakSet<HTMLElement>();

    const finish = (element: HTMLElement) => {
      observer.unobserve(element);
      const animation = animations.get(element);
      animations.delete(element);
      animation?.cancel();
    };

    const observer = new IntersectionObserver((entries) => {
      let index = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.14) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        const animation = animations.get(element);
        if (!animation) continue;
        if (preference.matches || entry.boundingClientRect.bottom <= 0) {
          finish(element);
          continue;
        }
        // A small cascade lets the section title lead its text and cards.
        // Keep masks off paused elements so IntersectionObserver can see them.
        (animation.effect as KeyframeEffect).setKeyframes(entrance(element).frames);
        animation.effect?.updateTiming({ delay: Math.min(index++, 3) * 85 });
        animation.play();
      }
    }, { threshold: 0.14 });

    const register = (root: HTMLElement) => {
      if (preference.matches) return;
      const elements = root.matches(targets) ? [root, ...root.querySelectorAll<HTMLElement>(targets)] : root.querySelectorAll<HTMLElement>(targets);
      for (const element of elements) {
        if (seen.has(element)) continue;
        seen.add(element);
        if (element.closest(excluded)) continue;
        let parent = element.parentElement;
        while (parent && !enrolled.has(parent)) parent = parent.parentElement;
        if (parent) continue;
        if (element.matches(".card, article, figure") && element.querySelector("form, input, select, textarea, iframe")) continue;
        const rect = element.getBoundingClientRect();
        // The first viewport and long article containers stay immediately visible.
        if (!rect.width || !rect.height || rect.top < window.innerHeight || rect.height > window.innerHeight * 0.85) continue;
        const { kind, frames, duration } = entrance(element);
        const animation = element.animate(frames.map((frame) => ({ ...frame, clipPath: "none" })), {
          duration,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        });
        animation.id = `scroll-reveal-${kind}`;
        animation.pause();
        animation.currentTime = 0;
        animation.onfinish = () => finish(element);
        animations.set(element, animation);
        enrolled.add(element);
        observer.observe(element);
      }
    };

    register(main);
    const footer = document.querySelector<HTMLElement>("body > footer");
    if (footer) register(footer);

    // Streamed sections and CMS/carousel updates use the same entrance treatment.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) register(node);
        }
      }
      for (const element of animations.keys()) {
        if (!element.isConnected) {
          finish(element);
          enrolled.delete(element);
          seen.delete(element);
        }
      }
    });
    mutations.observe(main, { childList: true, subtree: true });

    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      for (const element of animations.keys()) {
        if (element.contains(event.target)) finish(element);
      }
    };
    const showAll = () => {
      for (const element of animations.keys()) finish(element);
    };
    const reduceMotion = () => {
      if (preference.matches) showAll();
    };
    document.addEventListener("focusin", focus);
    preference.addEventListener("change", reduceMotion);
    window.addEventListener("beforeprint", showAll);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("focusin", focus);
      preference.removeEventListener("change", reduceMotion);
      window.removeEventListener("beforeprint", showAll);
      showAll();
    };
  }, [pathname]);

  return null;
}
