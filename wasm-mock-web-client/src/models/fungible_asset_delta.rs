use miden_objects::account::{
    AccountId as NativeAccountId, FungibleAssetDelta as NativeFungibleAssetDelta,
};
use wasm_bindgen::prelude::*;

use super::account_id::AccountId;

#[derive(Clone)]
#[wasm_bindgen]
pub struct FungibleAssetDeltaItem {
    faucet_id: AccountId,
    amount: i64,
}

#[wasm_bindgen]
impl FungibleAssetDeltaItem {
    #[wasm_bindgen(getter, js_name = "faucetId")]
    pub fn faucet_id(&self) -> AccountId {
        self.faucet_id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn amount(&self) -> i64 {
        self.amount.clone()
    }
}

impl From<(&NativeAccountId, &i64)> for FungibleAssetDeltaItem {
    fn from(native_fungible_asset_delta_item: (&NativeAccountId, &i64)) -> Self {
        Self {
            faucet_id: native_fungible_asset_delta_item.0.clone().into(),
            amount: native_fungible_asset_delta_item.1.clone(),
        }
    }
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct FungibleAssetDelta(NativeFungibleAssetDelta);
#[wasm_bindgen]
impl FungibleAssetDelta {
    // pub fn amount(&self, faucet_id: &AccountId) -> i64 {
    //     self.0.amount(faucet_id.into()).unwrap()
    // }

    #[wasm_bindgen(js_name = "numAssets")]
    pub fn num_assets(&self) -> usize {
        self.0.num_assets()
    }

    #[wasm_bindgen(js_name = "isEmpty")]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn iter(&self) -> Vec<FungibleAssetDeltaItem> {
        self.0.iter().map(Into::into).collect()
    }

    // pub fn iter(&self) -> impl Iterator<Item = (&AccountId, &i64)> {
    //     self.0.iter()
    // }
}

// CONVERSIONS
// ================================================================================================

impl From<NativeFungibleAssetDelta> for FungibleAssetDelta {
    fn from(native_fungible_asset_delta: NativeFungibleAssetDelta) -> Self {
        FungibleAssetDelta(native_fungible_asset_delta)
    }
}

impl From<&NativeFungibleAssetDelta> for FungibleAssetDelta {
    fn from(native_fungible_asset_delta: &NativeFungibleAssetDelta) -> Self {
        FungibleAssetDelta(native_fungible_asset_delta.clone())
    }
}
