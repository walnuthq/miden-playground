// The script explorer's tree, after miden-source-code-verification's
// web-viewer (`lib/source-files.ts`). Plain node runs its unit tests.

// A file (no `children`) or folder.
export type FileTreeNode = {
  name: string;
  path: string;
  children?: FileTreeNode[];
};

// Folders first, then files, each alphabetically, as VS Code's explorer does.
const compareNodes = (a: FileTreeNode, b: FileTreeNode) => {
  if (!a.children !== !b.children) {
    return a.children ? -1 : 1;
  }
  return a.name.localeCompare(b.name, "en");
};

const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
  for (const node of nodes) {
    if (node.children) {
      sortTree(node.children);
    }
  }
  return nodes.sort(compareNodes);
};

export const buildFileTree = (paths: string[]): FileTreeNode[] => {
  const root: FileTreeNode[] = [];
  for (const path of paths) {
    const parts = path.split("/");
    let level = root;
    parts.forEach((name, index) => {
      const nodePath = parts.slice(0, index + 1).join("/");
      if (index === parts.length - 1) {
        level.push({ name, path: nodePath });
        return;
      }
      let folder = level.find((node) => node.children && node.name === name);
      if (!folder) {
        folder = { name, path: nodePath, children: [] };
        level.push(folder);
      }
      level = folder.children ?? [];
    });
  }
  return sortTree(root);
};
