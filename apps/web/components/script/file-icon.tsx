import { FileCode, FileCog } from "lucide-react";

// Rust sources get a code icon, manifests (the only other files shown) a cog.
const FileIcon = ({
  path,
  className,
}: {
  path: string;
  className?: string;
}) => {
  const Icon = path.endsWith(".rs") ? FileCode : FileCog;
  return <Icon className={className} data-icon="inline-start" />;
};

export default FileIcon;
