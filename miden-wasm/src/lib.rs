#![no_std]
extern crate alloc;

mod account_builder;
mod bindings;
mod mock_chain;
mod mock_host;
mod scripts;
mod serialization;
mod transaction_context;
mod transaction_context_builder;
mod utils;

use crate::transaction_context_builder::TransactionContextBuilder;

use alloc::{format, string::ToString, sync::Arc, vec, vec::Vec};
use bindings::{AccountData, AssetData, NoteData};
use miden_crypto::rand::{FeltRng, RpoRandomCoin};
use miden_lib::{notes::utils::build_p2id_recipient, transaction::TransactionKernel};
use miden_objects::{
    accounts::{AccountId, AccountType},
    assets::Asset,
    notes::{Note, NoteExecutionHint, NoteExecutionMode, NoteInputs, NoteTag},
    transaction::{TransactionArgs, TransactionScript},
    Felt, Word,
};
use miden_tx::TransactionExecutor;
use rand::Rng;
use rand_chacha::{rand_core::SeedableRng, ChaCha20Rng};
use scripts::{ACCOUNT_SCRIPT, P2ID_SCRIPT};
use serialization::serialize_execution_output;
use wasm_bindgen::prelude::*;

// Added this line to import the necessary libraries for more detailed logging
extern crate console_error_panic_hook;

#[wasm_bindgen]
pub fn generate_account_id(seed: Vec<u8>) -> Result<u64, JsValue> {
    let seed_array: [u8; 32] = seed
        .try_into()
        .map_err(|err| format!("seed must be 32 bytes: {:?}", err))?;
    let id: u64 = AccountId::new_dummy(seed_array, AccountType::RegularAccountUpdatableCode).into();
    Ok(id)
}

#[wasm_bindgen]
pub fn generate_faucet_id(seed: Vec<u8>) -> Result<u64, JsValue> {
    let seed_array: [u8; 32] = seed
        .try_into()
        .map_err(|err| format!("seed must be 32 bytes: {:?}", err))?;
    let id: u64 = AccountId::new_dummy(seed_array, AccountType::FungibleFaucet).into();
    Ok(id)
}

#[wasm_bindgen]
pub fn generate_note_serial_number(seed: Vec<u8>) -> Result<Vec<u64>, JsValue> {
    let mut rng = ChaCha20Rng::from_seed(
        seed.try_into()
            .map_err(|err| format!("seed must be 32 bytes: {:?}", err))?,
    );
    let coin_seed: [u64; 4] = rng.gen();
    Ok(coin_seed.to_vec())
}

#[wasm_bindgen]
pub fn execute_transaction(
    transaction_script: &str,
    receiver: AccountData,
    notes: Vec<NoteData>,
    block_number: u64,
) -> Result<JsValue, JsValue> {
    let mut receiver = receiver;

    let notes = notes
        .into_iter()
        .map(|note| Note::try_from(note))
        .collect::<anyhow::Result<Vec<Note>>>()
        .map_err(|err| format!("Note cannot be built: {:?}", err))?;

    let assembler = TransactionKernel::assembler().with_debug_mode(true);

    let tx_script = TransactionScript::compile(
        transaction_script,
        [],
        assembler
            .with_library(receiver.code_library.clone())
            .expect("adding oracle library should not fail")
            .clone(),
    )
    .map_err(|err| JsValue::from_str(&err.to_string()))?;

    let tx_args_target = TransactionArgs::with_tx_script(tx_script.clone());

    let tx_context = TransactionContextBuilder::new(receiver.account.clone())
        .input_notes(notes.clone())
        .build(block_number);

    let executor =
        TransactionExecutor::new(Arc::new(tx_context.clone()), Some(receiver.falcon_auth()))
            .with_tracing();

    let block_ref = tx_context.tx_inputs().block_header().block_num();

    let note_ids = tx_context
        .tx_inputs()
        .input_notes()
        .iter()
        .map(|note| note.id())
        .collect::<Vec<_>>();

    let executed_transaction = executor
        .execute_transaction(receiver.account.id(), block_ref, &note_ids, tx_args_target)
        .map_err(|err| format!("Execution failed: {:?}", err))?;

    receiver
        .account
        .apply_delta(executed_transaction.account_delta())
        .map_err(|err| format!("Account delta cannot be applied: {:?}", err))?;

    let final_account = executed_transaction.final_account();
    let output_notes = executed_transaction.output_notes();

    serialize_execution_output(
        &receiver.account,
        &final_account,
        &output_notes,
        &executed_transaction,
    )
}

#[wasm_bindgen]
pub struct CreateSwapNoteResult {
    note_inputs: Vec<u64>,
    payback_note: NoteData,
}

#[wasm_bindgen]
impl CreateSwapNoteResult {
    pub fn note_inputs(&self) -> Vec<u64> {
        self.note_inputs.clone()
    }

    pub fn payback_note(&self) -> NoteData {
        self.payback_note.clone()
    }
}

#[wasm_bindgen]
pub fn create_swap_note(
    seed: Vec<u8>,
    sender_account_id: u64,
    receiver_account_id: u64,
    requested_asset: AssetData,
) -> Result<CreateSwapNoteResult, JsValue> {
    let sender = AccountId::try_from(sender_account_id)
        .map_err(|err| format!("Failed to convert sender account id: {:?}", err))?;
    let requested_asset_converted: Asset = requested_asset
        .clone()
        .try_into()
        .map_err(|err| format!("Failed to convert requested asset: {:?}", err))?;

    let mut rng = ChaCha20Rng::from_seed(
        seed.try_into()
            .map_err(|err| format!("Failed to convert seed: {:?}", err))?,
    );
    let coin_seed: [u64; 4] = rng.gen();
    let mut rng = RpoRandomCoin::new(coin_seed.map(Felt::new));

    let payback_serial_num = rng.draw_word();
    let payback_recipient = build_p2id_recipient(sender, payback_serial_num)
        .map_err(|err| format!("Failed to build payback recipient: {:?}", err))?;

    let payback_recipient_word: Word = payback_recipient.digest().into();
    let requested_asset_word: Word = requested_asset_converted.into();
    let payback_tag = NoteTag::from_account_id(sender, NoteExecutionMode::Local)
        .map_err(|err| format!("Failed to build payback tag: {:?}", err))?;

    let inputs = NoteInputs::new(vec![
        payback_recipient_word[0],
        payback_recipient_word[1],
        payback_recipient_word[2],
        payback_recipient_word[3],
        requested_asset_word[0],
        requested_asset_word[1],
        requested_asset_word[2],
        requested_asset_word[3],
        Felt::new(payback_tag.inner() as u64),
        NoteExecutionHint::always().into(),
    ])
    .map_err(|err| format!("Failed to build inputs: {:?}", err))?;

    let inputs_u64 = inputs
        .values()
        .iter()
        .map(|x| x.as_int())
        .collect::<Vec<u64>>();

    Ok(CreateSwapNoteResult {
        note_inputs: inputs_u64,
        payback_note: NoteData {
            assets: vec![requested_asset],
            inputs: payback_recipient
                .inputs()
                .values()
                .iter()
                .map(|x| x.as_int())
                .collect(),
            script: P2ID_SCRIPT.to_string(),
            sender_id: receiver_account_id,
            sender_script: ACCOUNT_SCRIPT.to_string(),
            serial_number: payback_serial_num.iter().map(|x| x.as_int()).collect(),
        },
    })
}
