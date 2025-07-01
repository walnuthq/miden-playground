use miden_objects::{Felt as NativeFelt, account::AccountId as NativeAccountId};
use wasm_bindgen::prelude::*;

use super::{felt::Felt, network_id::NetworkId};

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct AccountId(NativeAccountId);

#[wasm_bindgen]
impl AccountId {
    #[wasm_bindgen(js_name = "fromHex")]
    pub fn from_hex(hex: &str) -> AccountId {
        let native_account_id = NativeAccountId::from_hex(hex).unwrap();
        AccountId(native_account_id)
    }

    #[wasm_bindgen(js_name = "isFaucet")]
    pub fn is_faucet(&self) -> bool {
        self.0.is_faucet()
    }

    #[wasm_bindgen(js_name = "isRegularAccount")]
    pub fn is_regular_account(&self) -> bool {
        self.0.is_regular_account()
    }

    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    pub fn prefix(&self) -> Felt {
        let native_felt: NativeFelt = self.0.prefix().as_felt();
        native_felt.into()
    }

    pub fn suffix(&self) -> Felt {
        let native_felt: NativeFelt = self.0.suffix();
        native_felt.into()
    }

    #[wasm_bindgen(js_name = "toBech32")]
    pub fn to_bech32(&self, network_id: NetworkId) -> String {
        self.0.to_bech32(network_id.into())
    }
}

// CONVERSIONS
// ================================================================================================

impl From<NativeAccountId> for AccountId {
    fn from(native_account_id: NativeAccountId) -> Self {
        AccountId(native_account_id)
    }
}

impl From<&NativeAccountId> for AccountId {
    fn from(native_account_id: &NativeAccountId) -> Self {
        AccountId(*native_account_id)
    }
}

impl From<AccountId> for NativeAccountId {
    fn from(account_id: AccountId) -> Self {
        account_id.0
    }
}

impl From<&AccountId> for NativeAccountId {
    fn from(account_id: &AccountId) -> Self {
        account_id.0
    }
}
