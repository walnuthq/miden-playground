import { type LucideIcon, SquareArrowOutUpRight } from "lucide-react";
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

// Takes the code as a string so that braces need no JSX escaping. `action`
// (a button adding the code to the user's script) goes under it, on the right.
// A line wider than the panel scrolls inside the block: the panel would clip
// it on desktop, and scroll as a whole on a phone.
export const CodeBlock = ({
  code,
  action,
}: {
  code: string;
  action?: ReactNode;
}) => {
  const block = (
    <pre className="overflow-x-auto">
      <InlineCode>{code}</InlineCode>
    </pre>
  );
  return action ? (
    <div className="flex flex-col gap-2">
      {block}
      <div className="flex justify-end">{action}</div>
    </div>
  ) : (
    block
  );
};

// A button named as it looks, its icon then its label: below `lg`, buttons
// like "Create new account" show their icon only, so naming both reads right
// on any screen. Only for those: labelled buttons and menu items take
// <em>"…"</em>.
export const ButtonName = ({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) => (
  <em>
    <Icon aria-hidden className="mr-0.5 inline size-4 align-text-bottom" />
    &quot;{children}&quot;
  </em>
);
