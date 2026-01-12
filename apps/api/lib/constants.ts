export const projectRoot =
  process.env.NODE_ENV !== "production" ? "." : "../../../..";

export const packagesPath = process.env.PACKAGES_PATH ?? "/tmp";
