use miden_objects::account::AccountVaultDelta as NativeAccountVaultDelta;
use wasm_bindgen::prelude::*;

use super::{
    // account_storage_delta::AccountStorageDelta,
    fungible_asset_delta::FungibleAssetDelta,
};

#[derive(Clone)]
#[wasm_bindgen]
pub struct AccountVaultDelta(NativeAccountVaultDelta);

#[wasm_bindgen]
impl AccountVaultDelta {
    #[wasm_bindgen(js_name = "isEmpty")]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn fungible(&self) -> FungibleAssetDelta {
        self.0.fungible().into()
    }

    // TODO: storage
    // pub fn storage(&self) -> AccountStorageDelta {
    //     self.0.storage().into()
    // }

    // pub fn vault(&self) -> AccountVaultDelta {
    //     self.0.vault().into()
    // }

    // pub fn nonce(&self) -> Option<Felt> {
    //     self.0.nonce().map(Into::into)
    // }

    // TODO: into parts
    // pub fn into_parts(self) -> (AccountStorageDelta, AccountVaultDelta, Option<Felt>) {
    //     let (storage, vault, nonce) = self.0.into_parts();
    //     (storage.into(), vault.into(), nonce.map(|nonce| nonce.into()))
    // }
}

// CONVERSIONS
// ================================================================================================

impl From<NativeAccountVaultDelta> for AccountVaultDelta {
    fn from(native_account_vault_delta: NativeAccountVaultDelta) -> Self {
        AccountVaultDelta(native_account_vault_delta)
    }
}

impl From<&NativeAccountVaultDelta> for AccountVaultDelta {
    fn from(native_account_vault_delta: &NativeAccountVaultDelta) -> Self {
        AccountVaultDelta(native_account_vault_delta.clone())
    }
}
