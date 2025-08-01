use miden_client::transaction::TransactionRequest as NativeTransactionRequest;
use miden_objects::note::Note as NativeNote;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::js_sys::Uint8Array;

use crate::{
    models::note::Note,
    utils::{deserialize_from_uint8array, serialize_to_uint8array},
};

pub mod note_and_args;
pub mod note_details_and_tag;
pub mod note_id_and_args;
pub mod transaction_request_builder;

use note_details_and_tag::NoteDetailsAndTag;

#[derive(Clone)]
#[wasm_bindgen]
pub struct TransactionRequest(NativeTransactionRequest);

#[wasm_bindgen]
impl TransactionRequest {
    pub fn serialize(&self) -> Uint8Array {
        serialize_to_uint8array(&self.0)
    }

    pub fn deserialize(bytes: &Uint8Array) -> Result<TransactionRequest, JsValue> {
        deserialize_from_uint8array::<NativeTransactionRequest>(bytes).map(TransactionRequest)
    }

    #[wasm_bindgen(js_name = "expectedOutputOwnNotes")]
    pub fn expected_output_own_notes(&self) -> Result<Vec<Note>, JsValue> {
        let native_notes: Vec<NativeNote> = self.0.expected_output_own_notes();
        let notes: Vec<Note> = native_notes.into_iter().map(Into::into).collect();
        Ok(notes)
    }

    #[wasm_bindgen(js_name = "expectedFutureNotes")]
    pub fn expected_future_notes(&self) -> Result<Vec<NoteDetailsAndTag>, JsValue> {
        self.0
            .expected_future_notes()
            .cloned()  // This converts &(T, U) to (T, U)
            .map(|(note_details, note_tag)| {
                Ok(NoteDetailsAndTag::new(
                    note_details.into(),
                    note_tag.into()
                ))
            })
            .collect::<Result<Vec<NoteDetailsAndTag>, _>>()
    }
}

// CONVERSIONS
// ================================================================================================

impl From<TransactionRequest> for NativeTransactionRequest {
    fn from(transaction_request: TransactionRequest) -> Self {
        transaction_request.0
    }
}

impl From<&TransactionRequest> for NativeTransactionRequest {
    fn from(transaction_request: &TransactionRequest) -> Self {
        transaction_request.0.clone()
    }
}

impl From<NativeTransactionRequest> for TransactionRequest {
    fn from(transaction_request: NativeTransactionRequest) -> Self {
        TransactionRequest(transaction_request)
    }
}

impl From<&NativeTransactionRequest> for TransactionRequest {
    fn from(transaction_request: &NativeTransactionRequest) -> Self {
        TransactionRequest(transaction_request.clone())
    }
}
