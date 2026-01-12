import { type NextRequest, NextResponse } from "next/server";
import { compilePackage, newPackage, readPackage } from "@/lib/miden-compiler";
import { counterContractDeployer } from "@/lib/counter-contract-deployer";

type DeployCounterContractRequestBody = {
  accountIdPrefix: string;
  accountIdSuffix: string;
};

const counterContractRust = `#![no_std]
#![feature(alloc_error_handler)]

use miden::{Felt, StorageMap, StorageMapAccess, Word, component, felt};

#[component]
struct CounterContract {
    #[storage(slot(0), description = "counter contract storage map")]
    count_map: StorageMap,
}

#[component]
impl CounterContract {
    pub fn get_count(&self) -> Felt {
        let key = Word::from([felt!(0), felt!(0), felt!(ACCOUNT_ID_PREFIX), felt!(ACCOUNT_ID_SUFFIX)]);
        self.count_map.get(&key)
    }

    pub fn increment_count(&mut self) -> Felt {
        let key = Word::from([felt!(0), felt!(0), felt!(ACCOUNT_ID_PREFIX), felt!(ACCOUNT_ID_SUFFIX)]);
        let current_value: Felt = self.count_map.get(&key);
        let new_value = current_value + felt!(1);
        self.count_map.set(key, new_value);
        new_value
    }
}
`;

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { accountIdPrefix, accountIdSuffix } =
      body as DeployCounterContractRequestBody;
    const { id } = await newPackage({
      name: "counter-contract",
      type: "account",
      rust: counterContractRust
        .replaceAll("ACCOUNT_ID_PREFIX", accountIdPrefix)
        .replaceAll("ACCOUNT_ID_SUFFIX", accountIdSuffix),
    });
    await compilePackage(id);
    const { masp } = await readPackage({
      packageDir: id,
      name: "counter-contract",
    });
    const address = await counterContractDeployer({
      accountIdPrefix,
      accountIdSuffix,
      masp,
    });
    return NextResponse.json({ ok: true, address });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return NextResponse.json({ ok: false, error: message });
  }
};
