import { type ReactNode } from "react";
import { SquareArrowOutUpRight } from "lucide-react";
import type { MDXComponents } from "mdx/types";

const components = {
  a: ({ href, children }: { href: string; children: ReactNode }) => (
    <a
      href={href}
      className="text-primary font-medium underline underline-offset-4 inline-flex items-center gap-1"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children} <SquareArrowOutUpRight className="size-4" />
    </a>
  ),
  ul: ({ children }) => (
    <ul className="ml-6 list-disc [&>li]:mt-2">{children}</ul>
  ),
} satisfies MDXComponents;

export const useMDXComponents = (): MDXComponents => components;
