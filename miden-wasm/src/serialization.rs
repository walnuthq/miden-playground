use alloc::{string::ToString, vec, vec::Vec};
use miden_objects::{
    account::{Account, AccountHeader, StorageSlot},
    asset::Asset,
    transaction::{ExecutedTransaction, OutputNotes},
};
use wasm_bindgen::JsValue;
use web_sys::js_sys::{self, BigUint64Array};

fn serialize_assets(assets: &[Asset]) -> Result<js_sys::Array, JsValue> {
    let assets_array = js_sys::Array::new();

    for asset in assets {
        let asset_obj = js_sys::Object::new();
        match asset {
            Asset::Fungible(asset) => {
                js_sys::Reflect::set(
                    &asset_obj,
                    &"faucetId".into(),
                    &JsValue::from(asset.faucet_id().to_hex()),
                )?;
                js_sys::Reflect::set(&asset_obj, &"amount".into(), &JsValue::from(asset.amount()))?;
            }
            Asset::NonFungible(_) => {
                continue;
            }
        }
        assets_array.push(&asset_obj);
    }

    Ok(assets_array)
}

pub fn serialize_execution_output(
    account: &Account,
    final_account: &AccountHeader,
    output_notes: &OutputNotes,
    executed_transaction: &ExecutedTransaction,
) -> Result<JsValue, JsValue> {
    let assets: Vec<Asset> = account.vault().assets().collect();
    let assets_array = serialize_assets(&assets)?;
    let storage: Vec<Vec<u64>> = account
        .storage()
        .slots()
        .iter()
        .map(|slot| match slot {
            StorageSlot::Value(value) => value.iter().map(|x| x.as_int()).collect(),
            StorageSlot::Map(_) => vec![],
        })
        .collect();

    let account_hash = final_account.hash().to_hex();
    let code_commitment = final_account.code_commitment().to_hex();
    let storage_commitment = final_account.storage_commitment().to_hex();
    let vault_root = final_account.vault_root().to_hex();
    let nonce = final_account.nonce().as_int();

    let account_id = account.id().to_hex();

    let output_notes_array = js_sys::Array::new();
    for note in output_notes.iter() {
        let note_obj = js_sys::Object::new();
        js_sys::Reflect::set(&note_obj, &"id".into(), &JsValue::from(note.id().to_hex()))?;
        js_sys::Reflect::set(
            &note_obj,
            &"senderId".into(),
            &JsValue::from(note.metadata().sender().to_string()),
        )?;
        js_sys::Reflect::set(
            &note_obj,
            &"tag".into(),
            &JsValue::from(note.metadata().tag().to_string()),
        )?;
        if let Some(note_assets) = note.assets() {
            let assets: Vec<Asset> = note_assets.iter().map(|a| a.clone()).collect();
            let serialized_assets = serialize_assets(&assets)?;
            js_sys::Reflect::set(&note_obj, &"assets".into(), &serialized_assets)?;
        }
        output_notes_array.push(&note_obj);
    }

    let total_cycles = executed_transaction.measurements().total_cycles();
    let trace_length = executed_transaction.measurements().trace_length();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(&obj, &"outputNotes".into(), &output_notes_array)?;
    js_sys::Reflect::set(&obj, &"assets".into(), &assets_array)?;
    js_sys::Reflect::set(
        &obj,
        &"storage".into(),
        &JsValue::from(
            storage
                .iter()
                .map(|row| BigUint64Array::from(row.as_slice()))
                .collect::<js_sys::Array>(),
        ),
    )?;
    js_sys::Reflect::set(&obj, &"accountHash".into(), &JsValue::from(account_hash))?;
    js_sys::Reflect::set(
        &obj,
        &"codeCommitment".into(),
        &JsValue::from(code_commitment),
    )?;
    js_sys::Reflect::set(
        &obj,
        &"storageCommitment".into(),
        &JsValue::from(storage_commitment),
    )?;
    js_sys::Reflect::set(&obj, &"vaultRoot".into(), &JsValue::from(vault_root))?;
    js_sys::Reflect::set(&obj, &"nonce".into(), &JsValue::from(nonce))?;
    js_sys::Reflect::set(&obj, &"accountId".into(), &JsValue::from(account_id))?;
    js_sys::Reflect::set(&obj, &"totalCycles".into(), &JsValue::from(total_cycles))?;
    js_sys::Reflect::set(&obj, &"traceLength".into(), &JsValue::from(trace_length))?;

    Ok(obj.into())
}
