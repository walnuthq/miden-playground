declare module "*.mdx" {
  import type { FunctionComponent } from "react";
  import type { MDXProps } from "mdx/types";

  const MDXContent: FunctionComponent<MDXProps>;
  export default MDXContent;
}
