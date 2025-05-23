use alloc::{format, string::String, sync::Arc, vec::Vec};
use assembly::Library;
use miden_objects::{
    account::{Account, AccountId, StorageSlot},
    asset::{Asset, FungibleAsset},
    note::{Note, NoteTag},
    Felt, Word, ZERO,
};
use wasm_bindgen::{convert::IntoWasmAbi, prelude::*};
use web_sys::console;

use crate::utils::{
    create_account_component_library, get_account_with_account_code,
    get_note_with_fungible_asset_and_script, get_pk_and_authenticator,
};

#[wasm_bindgen(getter_with_clone)]
#[derive(Clone, Debug)]
pub struct AccountIdData {
    pub id: String,
    pub prefix: u64,
    pub suffix: u64,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct WordData(Word);

#[wasm_bindgen]
impl WordData {
    #[wasm_bindgen(constructor)]
    pub fn new(word: Vec<u64>) -> Result<Self, String> {
        let u64_array: [u64; 4] = word
            .as_slice()
            .try_into()
            .map_err(|err| format!("word must be a Vec<u64> of length 4: {:?}", err))?;
        Ok(Self(u64_array.map(Felt::new)))
    }
}

impl From<WordData> for Word {
    fn from(word: WordData) -> Self {
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
        account_id: String,
        assets: Vec<AssetData>,
        wallet_enabled: bool,
        auth_enabled: bool,
        storage: Vec<WordData>,
        nonce: u64,
    ) -> Result<Self, JsValue> {
        let account_code_library = create_account_component_library(account_code.as_str())
            .map_err(|err| format!("Account library cannot be built: {:?}", err))?;

        let account_id = AccountId::from_hex(&account_id)
            .map_err(|err| format!("Target Account id is wrong: {:?}", err))?;

        let (pub_key, _) = get_pk_and_authenticator(Some(secret_key.clone()));

        let account = get_account_with_account_code(
            account_code_library.clone(),
            account_id,
            pub_key,
            assets
                .into_iter()
                .map(|a| {
                    a.try_into()
                        .map_err(|err| format!("Asset cannot be built: {:?}", err))
                })
                .collect::<Result<Vec<Asset>, String>>()?,
            storage
                .into_iter()
                .map(|s| StorageSlot::Value(s.into()))
                .collect(),
            wallet_enabled,
            auth_enabled,
            nonce,
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

#[wasm_bindgen(getter_with_clone)]
#[derive(Clone, Debug)]
pub struct AssetData {
    pub faucet_id: String,
    pub amount: u64,
}

#[wasm_bindgen]
impl AssetData {
    #[wasm_bindgen(constructor)]
    pub fn new(faucet_id: String, amount: u64) -> Self {
        Self { faucet_id, amount }
    }
}

impl TryFrom<AssetData> for Asset {
    type Error = anyhow::Error;

    fn try_from(asset: AssetData) -> Result<Self, Self::Error> {
        let asset_id = AccountId::from_hex(&asset.faucet_id).map_err(|err| anyhow::anyhow!(err))?;

        Ok(Self::Fungible(
            FungibleAsset::new(asset_id, asset.amount).map_err(|err| anyhow::anyhow!(err))?,
        ))
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct NoteData {
    pub(crate) assets: Vec<AssetData>,
    pub(crate) inputs: Vec<u64>,
    pub(crate) script: String,
    pub(crate) sender_id: String,
    pub(crate) sender_script: String,
    pub(crate) serial_number: Vec<u64>,
    pub(crate) id: Option<String>,
    pub(crate) tag: u32,
    pub(crate) aux: u64,
}

#[wasm_bindgen]
impl NoteData {
    #[wasm_bindgen(constructor)]
    pub fn new(
        assets: Vec<AssetData>,
        inputs: Vec<u64>,
        script: String,
        sender_id: String,
        sender_script: String,
        serial_number: Vec<u64>,
        tag: u32,
        aux: u64,
        id: Option<String>,
    ) -> Self {
        Self {
            assets,
            inputs,
            script,
            sender_id,
            sender_script,
            serial_number,
            id,
            tag,
            aux,
        }
    }

    pub fn inputs(&self) -> Vec<u64> {
        self.inputs.clone()
    }

    pub fn script(&self) -> String {
        self.script.clone()
    }

    pub fn sender_id(&self) -> String {
        self.sender_id.clone()
    }

    pub fn sender_script(&self) -> String {
        self.sender_script.clone()
    }

    pub fn serial_number(&self) -> Vec<u64> {
        self.serial_number.clone()
    }

    pub fn id(&self) -> Option<String> {
        self.id.clone()
    }

    pub fn tag(&self) -> u32 {
        self.tag
    }

    pub fn aux(&self) -> u64 {
        self.aux
    }

    pub fn recipient_digest(&self) -> Result<String, JsValue> {
        let note = Note::try_from(self.clone())
            .map_err(|err| format!("Failed to convert note: {:?}", err))?;
        let digest = note.recipient().digest();
        Ok(digest.to_hex())
    }
}

impl TryFrom<NoteData> for Note {
    type Error = anyhow::Error;

    fn try_from(note_data: NoteData) -> Result<Self, Self::Error> {
        let note_assets: Vec<Asset> = note_data
            .assets
            .into_iter()
            .map(|asset_data| {
                let fungible_asset: Asset = asset_data.try_into()?;
                Ok(fungible_asset)
            })
            .collect::<anyhow::Result<Vec<Asset>>>()?;

        let note_inputs: Vec<Felt> = note_data.inputs.iter().map(|&x| Felt::new(x)).collect();

        let sender_account_id =
            AccountId::from_hex(&note_data.sender_id).map_err(|err| anyhow::anyhow!(err))?;

        let sender_account_code_library =
            create_account_component_library(note_data.sender_script.as_str())
                .map_err(|err| anyhow::anyhow!(err))?;

        let serial_number: [u64; 4] = note_data.serial_number.as_slice().try_into()?;

        let note = get_note_with_fungible_asset_and_script(
            note_assets,
            note_data.script.as_str(),
            sender_account_id,
            note_inputs,
            sender_account_code_library.clone(),
            serial_number.map(Felt::new),
            note_data.tag.into(),
            Felt::new(note_data.aux),
        )
        .map_err(|err| anyhow::anyhow!(err))?;

        Ok(note)
    }
}
