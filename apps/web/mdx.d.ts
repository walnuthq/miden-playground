declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  import type { FunctionComponent } from "react";

  const MDXContent: FunctionComponent<MDXProps>;
  export default MDXContent;
}
