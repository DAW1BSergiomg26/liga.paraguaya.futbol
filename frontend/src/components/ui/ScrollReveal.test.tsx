import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import ScrollReveal from "./ScrollReveal";

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("ScrollReveal", () => {
  it("renders children", () => {
    render(
      <ScrollReveal>
        <div>Test content</div>
      </ScrollReveal>
    );
    expect(screen.getByText("Test content")).toBeDefined();
  });

  it("applies className", () => {
    const { container } = render(
      <ScrollReveal className="custom-class">
        <div>Content</div>
      </ScrollReveal>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders multiple children with stagger", () => {
    const { container } = render(
      <ScrollReveal stagger={0.05}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </ScrollReveal>
    );
    const wrapper = container.querySelector("div > div");
    expect(wrapper?.children.length).toBe(3);
  });
});
