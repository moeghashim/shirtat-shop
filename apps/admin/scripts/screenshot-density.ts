import type { Page } from "playwright";

// Record computed geometry alongside the image, including standalone app iframes.
// This deliberately measures the rendered CSS rather than repeating token values.
export async function measureDensity(page: Page) {
  return Promise.all(
    page.frames().map(async (frame) => ({
      url: frame.url(),
      ...(await frame.evaluate(() => {
        const measure = (element: Element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            text: element.textContent?.trim().slice(0, 70),
            font: style.fontSize,
            lineHeight: style.lineHeight,
            height: rect.height,
            width: rect.width,
            padding: style.padding,
            gap: style.gap,
          };
        };
        const selectors = [
          "body",
          "header",
          "main > div",
          "[data-slot=card]",
          "[data-slot=card-header]",
          "[data-slot=card-content]",
          "[data-slot=table-body] tr",
          "[data-slot=table-cell]",
          "[data-slot=sidebar-menu-button]",
          "[data-slot=button]",
          "[data-slot=input]",
          "[data-slot=select-trigger]",
          "h1",
          "h2",
          "[data-slot=chart]",
        ];
        const samples = Object.fromEntries(
          selectors.map((selector) => [
            selector,
            Array.from(document.querySelectorAll(selector))
              .filter((e) => e.getClientRects().length)
              .slice(0, 6)
              .map(measure),
          ]),
        );
        const scale = Object.fromEntries(
          ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"].map((size) => {
            const probe = document.createElement("span");
            probe.className = `text-${size}`;
            document.body.append(probe);
            const font = getComputedStyle(probe).fontSize;
            probe.remove();
            return [size, font];
          }),
        );
        return {
          clippedSelectValues: Array.from(document.querySelectorAll('[data-slot="select-value"]'))
            .filter((value) => {
              if (!value.getClientRects().length || value.children.length) return false;
              const range = document.createRange();
              range.selectNodeContents(value);
              return range.getBoundingClientRect().width > value.getBoundingClientRect().width + 0.75;
            })
            .map((value) => value.textContent),
          overflowingCards: Array.from(document.querySelectorAll("[data-task-id]"))
            .filter((card) => {
              const inner = card.firstElementChild;
              return inner && inner.getBoundingClientRect().bottom > card.getBoundingClientRect().bottom + 1;
            })
            .map((card) => card.getAttribute("data-task-id")),
          root: getComputedStyle(document.documentElement).fontSize,
          spacing: getComputedStyle(document.documentElement).getPropertyValue("--spacing"),
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          scale,
          samples,
        };
      })),
    })),
  );
}
