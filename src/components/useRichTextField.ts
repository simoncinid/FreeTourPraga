"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { richHasText, sanitizeRichText } from "@/lib/rich-text";
import { useFormatTool } from "./FormatTool";

function inlineHtml(node: HTMLElement) {
  const draft = node.cloneNode(true) as HTMLElement;
  const block = "div,p";
  for (const element of draft.querySelectorAll<HTMLElement>(block)) {
    const plainBreak =
      element.childNodes.length === 1 && element.firstChild?.nodeName === "BR";
    if (plainBreak) element.replaceChildren();
    if (element.previousSibling) element.before("\n");
    if (
      element.nextSibling &&
      !(
        element.nextSibling instanceof Element &&
        element.nextSibling.matches(block)
      )
    )
      element.after("\n");
    if (element.attributes.length) {
      const span = document.createElement("span");
      for (const attribute of element.attributes)
        span.setAttribute(attribute.name, attribute.value);
      span.append(...element.childNodes);
      element.replaceWith(span);
    } else {
      element.replaceWith(...element.childNodes);
    }
  }
  for (const lineBreak of draft.querySelectorAll("br"))
    lineBreak.replaceWith("\n");
  return draft.innerHTML;
}

export function readRichTextField(node: HTMLElement) {
  return {
    html: sanitizeRichText(
      node.classList.contains("inline-rich-field")
        ? inlineHtml(node)
        : node.innerHTML,
    ),
    plain: node.innerText.replace(/\u00a0/g, " ").trim(),
  };
}

export function useRichTextField(
  html: string | undefined,
  text: string,
  onChange: (html: string, plain: string) => void,
  block: boolean,
) {
  const editor = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const format = useFormatTool();

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useLayoutEffect(() => {
    const node = editor.current;
    if (!node) return;
    if (richHasText(html)) {
      const next = sanitizeRichText(html!);
      if (readRichTextField(node).html !== next) node.innerHTML = next;
    } else if (node.innerText.replace(/\u00a0/g, " ").trim() !== text.trim()) {
      node.textContent = text;
    } else if (node.firstElementChild && document.activeElement !== node) {
      node.textContent = text;
    }
    format?.rememberSelection(node);
  }, [format, html, text]);

  const emit = useCallback(() => {
    const node = editor.current;
    if (!node) return;
    const { html, plain } = readRichTextField(node);
    onChangeRef.current(html, plain);
    format?.rememberSelection(node);
  }, [format]);

  useLayoutEffect(() => {
    const node = editor.current;
    if (!node || !format) return;
    const activate = () => format.register({ element: node, emit, block });
    node.addEventListener("focus", activate);
    if (document.activeElement === node) activate();
    return () => {
      node.removeEventListener("focus", activate);
      format.unregister(node);
    };
  }, [block, emit, format]);

  return {
    ref: editor,
    onInput: emit,
    onMouseUp: () => format?.rememberSelection(editor.current ?? undefined),
    onKeyUp: () => format?.rememberSelection(editor.current ?? undefined),
  };
}
