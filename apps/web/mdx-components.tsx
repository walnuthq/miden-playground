import { type ReactNode } from "react";
import type { MDXComponents } from "mdx/types";

const components = {
  a: ({ href, children }: { href: string; children: ReactNode }) => (
    <a
      href={href}
      className="text-primary font-medium underline underline-offset-4"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="ml-6 list-disc [&>li]:mt-2">{children}</ul>
  ),
} satisfies MDXComponents;

export const useMDXComponents = (): MDXComponents => components;
