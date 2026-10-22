import Link from "next/link";
import type { ReactNode } from "react";

const TutorialLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <Link
    href={href}
    className="text-primary font-medium underline underline-offset-4"
  >
    {children}
  </Link>
);

export default TutorialLink;
