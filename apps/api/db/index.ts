import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "@/db/relations";
import { PROJECT_ROOT } from "@/lib/constants";

dotenv.config({ path: `${PROJECT_ROOT}/.env.local` });

const db = drizzle(process.env.DATABASE_URL, {
  relations,
});

export default db;

/*
const seed = async () => {
  // setup default packages
  // setupDefaultPackagesDir();
  // clear database
  await db.delete(packagesTable);
  // default dependencies
  // await db.insert(packagesTable).values({
  //   name: "base",
  //   type: "account",
  //   status: "compiled",
  //   digest:
  //     "0x389cc47c54704ed5d03183bcdc0819010501a1cab9f07a421432fc5c2a2e77ef",
  // });
  // await db.insert(packagesTable).values({
  //   name: "std",
  //   type: "account",
  //   status: "compiled",
  //   digest:
  //     "0x2eaedee678906c235e33a89a64d16ea71b951a444463e9bcf8675ab1fe6210c0",
  // });
  // const basePackage = await db.query.packagesTable.findFirst({
  //   columns: { id: true },
  //   where: { name: "base" },
  // });
  // const stdPackage = await db.query.packagesTable.findFirst({
  //   columns: { id: true },
  //   where: { name: "std" },
  // });
  const { id } = await newPackage({
    name: "counter-contract",
    type: "account",
    rust: await readRust("counter-contract"),
  });
  await compilePackage("counter-contract");
  // await db.insert(packagesTable).values({
  //   name: "counter-contract",
  //   type: "account",
  //   status: "compiled",
  //   readOnly: true,
  //   rust: await readRust("counter-contract"),
  //   // exports: [],
  //   // dependencies: [basePackage?.id, stdPackage?.id].filter(
  //   //   (uuid) => uuid !== undefined
  //   // ),
  // });
  const packages = await db.query.packagesTable.findMany();
  console.log(packages);
};

// seed().then(() => process.exit());
*/
