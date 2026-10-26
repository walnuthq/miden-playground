import { SquareArrowOutUpRight } from "lucide-react";
import type { ReactNode } from "react";

// Tutorial step prose, styled as the markdown of the former MDX steps.

export const ExternalLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <a
    href={href}
    className="text-primary font-medium underline underline-offset-4 inline-flex items-center gap-1"
    target="_blank"
    rel="noreferrer"
  >
    {children} <SquareArrowOutUpRight className="size-4" />
  </a>
);

export const BulletList = ({ children }: { children: ReactNode }) => (
  <ul className="ml-6 list-disc [&>li]:mt-2">{children}</ul>
);

export const NumberedList = ({ children }: { children: ReactNode }) => (
  <ol className="ml-6 list-decimal [&>li]:mt-2">{children}</ol>
);

export const InlineCode = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-xs">{children}</code>
);

// Takes the code as a string so that braces need no JSX escaping.
export const CodeBlock = ({ code }: { code: string }) => (
  <pre>
    <InlineCode>{code}</InlineCode>
  </pre>
);
