use miden_objects::account::AccountBuilder as NativeAccountBuilder;
use wasm_bindgen::prelude::*;

use crate::{
    js_error_with_context,
    models::{
        account::Account, account_component::AccountComponent,
        account_storage_mode::AccountStorageMode, account_type::AccountType, word::Word,
    },
};

#[wasm_bindgen]
pub struct AccountBuilderResult {
    account: Account,
    seed: Word,
}

#[wasm_bindgen]
impl AccountBuilderResult {
    #[wasm_bindgen(getter)]
    pub fn account(&self) -> Account {
        self.account.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn seed(&self) -> Word {
        self.seed.clone()
    }
}

#[wasm_bindgen]
pub struct AccountBuilder(NativeAccountBuilder);

#[wasm_bindgen]
impl AccountBuilder {
    #[wasm_bindgen(constructor)]
    pub fn new(init_seed: Vec<u8>) -> Result<AccountBuilder, JsValue> {
        let seed_array: [u8; 32] = init_seed
            .try_into()
            .map_err(|_| JsValue::from_str("Seed must be exactly 32 bytes"))?;
        Ok(AccountBuilder(NativeAccountBuilder::new(seed_array)))
    }

    #[wasm_bindgen(js_name = "accountType")]
    pub fn account_type(mut self, account_type: AccountType) -> Self {
        self.0 = self.0.account_type(account_type.into());
        self
    }

    // TODO: AccountStorageMode as Enum
    #[wasm_bindgen(js_name = "storageMode")]
    pub fn storage_mode(mut self, storage_mode: &AccountStorageMode) -> Self {
        self.0 = self.0.storage_mode(storage_mode.into());
        self
    }

    #[wasm_bindgen(js_name = "withComponent")]
    pub fn with_component(mut self, account_component: &AccountComponent) -> Self {
        self.0 = self.0.with_component(account_component);
        self
    }

    #[wasm_bindgen(js_name = "withAuthComponent")]
    pub fn with_auth_component(mut self, account_component: &AccountComponent) -> Self {
        self.0 = self.0.with_auth_component(account_component);
        self
    }

    pub fn build(self) -> Result<AccountBuilderResult, JsValue> {
        let (account, seed) = self
            .0
            .build()
            .map_err(|err| js_error_with_context(err, "Failed to build account"))?;
        Ok(AccountBuilderResult {
            account: account.into(),
            seed: seed.into(),
        })
    }
}
