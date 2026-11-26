import { FileCode, FileCog } from "lucide-react";

// MASM sources get a code icon, the manifest (the only other file shown) a
// cog.
const FileIcon = ({
  path,
  className,
}: {
  path: string;
  className?: string;
}) => {
  const Icon = path.endsWith(".masm") ? FileCode : FileCog;
  return <Icon className={className} data-icon="inline-start" />;
};

export default FileIcon;
