// A minimal reader for the .tar.gz archives GitHub serves (`git archive`). It
// handles the ustar `prefix` field and pax `path` records git uses for paths
// over 100 characters, as well as GNU long names.

const BLOCK_SIZE = 512;

const decoder = new TextDecoder();

const readString = (block: Uint8Array, offset: number, length: number) => {
  const bytes = block.subarray(offset, offset + length);
  const end = bytes.indexOf(0);
  return decoder.decode(end === -1 ? bytes : bytes.subarray(0, end));
};

// Pax records are `<length> <key>=<value>\n`.
const readPaxPath = (data: Uint8Array) => {
  for (const record of decoder.decode(data).split("\n")) {
    const match = record.match(/^\d+ path=(.*)$/);
    if (match) {
      return match[1];
    }
  }
  return undefined;
};

export type TarFile = { path: string; content: string };

export const readTarGz = async (
  body: ReadableStream<Uint8Array>,
  filter: (path: string) => boolean,
) => {
  const buffer = new Uint8Array(
    await new Response(
      body.pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer(),
  );
  const files: TarFile[] = [];
  let offset = 0;
  let longPath: string | undefined;
  while (offset + BLOCK_SIZE <= buffer.length) {
    const header = buffer.subarray(offset, offset + BLOCK_SIZE);
    // The archive ends with zero-filled blocks.
    if (header[0] === 0) {
      break;
    }
    const size = Number.parseInt(readString(header, 124, 12).trim() || "0", 8);
    const type = String.fromCharCode(header[156] ?? 0);
    const data = buffer.subarray(
      offset + BLOCK_SIZE,
      offset + BLOCK_SIZE + size,
    );
    offset += BLOCK_SIZE + Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE;
    switch (type) {
      // Extended header for the next entry.
      case "x": {
        longPath = readPaxPath(data) ?? longPath;
        continue;
      }
      // GNU long name for the next entry.
      case "L": {
        longPath = readString(data, 0, size);
        continue;
      }
      // Global extended header: holds the commit id, no paths.
      case "g": {
        continue;
      }
    }
    const name = readString(header, 0, 100);
    const prefix = readString(header, 345, 155);
    const path = longPath ?? (prefix ? `${prefix}/${name}` : name);
    longPath = undefined;
    // Regular files only.
    if ((type === "0" || type === "\0") && filter(path)) {
      files.push({ path, content: decoder.decode(data) });
    }
  }
  return files;
};
