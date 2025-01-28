use alloc::{format, string::String, sync::Arc, vec::Vec};
use assembly::Library;
use miden_objects::{
    accounts::{Account, AccountId, StorageSlot},
    assets::{Asset, FungibleAsset},
    Felt, Word,
};
use wasm_bindgen::prelude::*;
use web_sys::console;

use crate::{
    create_account_component_library, get_account_with_account_code, get_pk_and_authenticator,
};

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct WordWrapper(Word);

#[wasm_bindgen]
impl WordWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new(word: Vec<u64>) -> Self {
        let u64_array: [u64; 4] = word
            .as_slice()
            .try_into()
            .expect("word must be a Vec<u64> of length 4");
        Self(u64_array.map(Felt::new))
    }
}

impl From<WordWrapper> for Word {
    fn from(word: WordWrapper) -> Self {
        word.0
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct AccountData {
    pub(crate) account: Account,
    pub(crate) code_library: Library,
    secret_key: Vec<u8>,
}

#[wasm_bindgen]
impl AccountData {
    #[wasm_bindgen(constructor)]
    pub fn new(
        account_code: String,
        secret_key: Vec<u8>,
        account_id: u64,
        assets: Vec<AssetData>,
        wallet_enabled: bool,
        auth_enabled: bool,
        storage: Vec<WordWrapper>,
    ) -> Result<Self, JsValue> {
        let account_code_library = create_account_component_library(account_code.as_str())
            .map_err(|err| format!("Account library cannot be built: {:?}", err))?;

        let account_id = AccountId::try_from(account_id)
            .map_err(|err| format!("Target Account id is wrong: {:?}", err))?;

        let (pub_key, _) = get_pk_and_authenticator(Some(secret_key.clone()));

        let account = get_account_with_account_code(
            account_code_library.clone(),
            account_id,
            pub_key,
            assets.into_iter().map(|a| a.into()).collect(),
            storage
                .into_iter()
                .map(|s| StorageSlot::Value(s.into()))
                .collect(),
            wallet_enabled,
            auth_enabled,
        )
        .map_err(|err| {
            console::log_1(&format!("Receiver account creation failed: {:?}", err).into());
            format!("Account cannot be built: {:?}", err)
        })?;

        Ok(Self {
            account,
            code_library: account_code_library,
            secret_key,
        })
    }

    pub(crate) fn falcon_auth(&self) -> Arc<dyn miden_tx::auth::TransactionAuthenticator> {
        let (_, falcon_auth) = get_pk_and_authenticator(Some(self.secret_key.clone()));
        falcon_auth
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct AssetData {
    pub faucet_id: u64,
    pub amount: u64,
}

#[wasm_bindgen]
impl AssetData {
    #[wasm_bindgen(constructor)]
    pub fn new(faucet_id: u64, amount: u64) -> Self {
        Self { faucet_id, amount }
    }
}

impl From<AssetData> for Asset {
    fn from(asset: AssetData) -> Self {
        Self::Fungible(
            FungibleAsset::new(AccountId::try_from(asset.faucet_id).unwrap(), asset.amount)
                .unwrap(),
        )
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct NoteData {
    pub(crate) assets: Vec<AssetData>,
    pub(crate) inputs: Vec<u64>,
    pub(crate) script: String,
    pub(crate) sender_id: u64,
    pub(crate) sender_script: String,
    pub(crate) serial_number: Vec<u64>,
}

#[wasm_bindgen]
impl NoteData {
    #[wasm_bindgen(constructor)]
    pub fn new(
        assets: Vec<AssetData>,
        inputs: Vec<u64>,
        script: String,
        sender_id: u64,
        sender_script: String,
        serial_number: Vec<u64>,
    ) -> Self {
        Self {
            assets,
            inputs,
            script,
            sender_id,
            sender_script,
            serial_number,
        }
    }

    pub fn inputs(&self) -> Vec<u64> {
        self.inputs.clone()
    }

    pub fn script(&self) -> String {
        self.script.clone()
    }

    pub fn sender_id(&self) -> u64 {
        self.sender_id
    }

    pub fn sender_script(&self) -> String {
        self.sender_script.clone()
    }

    pub fn serial_number(&self) -> Vec<u64> {
        self.serial_number.clone()
    }
}
