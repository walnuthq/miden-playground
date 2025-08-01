use miden_client::note::build_swap_tag as native_build_swap_tag;
use miden_objects::asset::{Asset as NativeAsset, FungibleAsset as NativeFungibleAsset};
use wasm_bindgen::prelude::*;

use crate::{
    WebClient, js_error_with_context,
    models::{
        account_id::AccountId, note_tag::NoteTag, note_type::NoteType, sync_summary::SyncSummary,
    },
};

#[wasm_bindgen]
impl WebClient {
    #[wasm_bindgen(js_name = "syncState")]
    pub async fn sync_state(&mut self) -> Result<SyncSummary, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let sync_summary = client
                .sync_state()
                .await
                .map_err(|err| js_error_with_context(err, "failed to sync state"))?;

            Ok(sync_summary.into())
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    #[wasm_bindgen(js_name = "getSyncHeight")]
    pub async fn get_sync_height(&mut self) -> Result<u32, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let sync_height = client
                .get_sync_height()
                .await
                .map_err(|err| js_error_with_context(err, "failed to get sync height"))?;

            Ok(sync_height.as_u32())
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    #[wasm_bindgen(js_name = "buildSwapTag")]
    pub fn build_swap_tag(
        note_type: NoteType,
        offered_asset_faucet_id: &AccountId,
        offered_asset_amount: u64,
        requested_asset_faucet_id: &AccountId,
        requested_asset_amount: u64,
    ) -> Result<NoteTag, JsValue> {
        let offered_fungible_asset: NativeAsset =
            NativeFungibleAsset::new(offered_asset_faucet_id.into(), offered_asset_amount)
                .map_err(|err| {
                    js_error_with_context(err, "failed to create offered fungible asset")
                })?
                .into();

        let requested_fungible_asset: NativeAsset =
            NativeFungibleAsset::new(requested_asset_faucet_id.into(), requested_asset_amount)
                .map_err(|err| {
                    js_error_with_context(err, "failed to create requested fungible asset")
                })?
                .into();

        let native_note_tag = native_build_swap_tag(
            note_type.into(),
            &offered_fungible_asset,
            &requested_fungible_asset,
        )
        .map_err(|err| js_error_with_context(err, "failed to build swap tag"))?;

        Ok(native_note_tag.into())
    }
}
