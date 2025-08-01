use miden_client::transaction::{
    ForeignAccount as NativeForeignAccount, NoteArgs as NativeNoteArgs,
    TransactionRequestBuilder as NativeTransactionRequestBuilder,
};
use miden_objects::{
    note::{
        Note as NativeNote, NoteDetails as NativeNoteDetails, NoteId as NativeNoteId,
        NoteRecipient as NativeNoteRecipient, NoteTag as NativeNoteTag,
    },
    transaction::{OutputNote as NativeOutputNote, TransactionScript as NativeTransactionScript},
    vm::AdviceMap as NativeAdviceMap,
};
use wasm_bindgen::prelude::*;

use crate::models::{
    advice_map::AdviceMap,
    foreign_account::ForeignAccount,
    note_recipient::RecipientArray,
    output_note::OutputNotesArray,
    transaction_request::{
        TransactionRequest, note_and_args::NoteAndArgsArray,
        note_details_and_tag::NoteDetailsAndTagArray, note_id_and_args::NoteIdAndArgsArray,
    },
    transaction_script::TransactionScript,
};

#[derive(Clone)]
#[wasm_bindgen]
pub struct TransactionRequestBuilder(NativeTransactionRequestBuilder);

#[wasm_bindgen]
impl TransactionRequestBuilder {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TransactionRequestBuilder {
        let native_transaction_request = NativeTransactionRequestBuilder::new();
        TransactionRequestBuilder(native_transaction_request)
    }

    #[wasm_bindgen(js_name = "withUnauthenticatedInputNotes")]
    pub fn with_unauthenticated_input_notes(mut self, notes: &NoteAndArgsArray) -> Self {
        let native_note_and_note_args: Vec<(NativeNote, Option<NativeNoteArgs>)> = notes.into();
        self.0 = self.0.clone().unauthenticated_input_notes(native_note_and_note_args);
        self
    }

    #[wasm_bindgen(js_name = "withAuthenticatedInputNotes")]
    pub fn with_authenticated_input_notes(mut self, notes: &NoteIdAndArgsArray) -> Self {
        let native_note_id_and_note_args: Vec<(NativeNoteId, Option<NativeNoteArgs>)> =
            notes.into();
        self.0 = self.0.clone().authenticated_input_notes(native_note_id_and_note_args);
        self
    }

    #[wasm_bindgen(js_name = "withOwnOutputNotes")]
    pub fn with_own_output_notes(mut self, notes: &OutputNotesArray) -> Self {
        let native_output_notes: Vec<NativeOutputNote> = notes.into();
        self.0 = self.0.clone().own_output_notes(native_output_notes);
        self
    }

    #[wasm_bindgen(js_name = "withCustomScript")]
    pub fn with_custom_script(mut self, script: &TransactionScript) -> Self {
        let native_script: NativeTransactionScript = script.into();
        self.0 = self.0.clone().custom_script(native_script);
        self
    }

    #[wasm_bindgen(js_name = "withExpectedOutputRecipients")]
    pub fn with_expected_output_notes(mut self, recipients: &RecipientArray) -> Self {
        let native_recipients: Vec<NativeNoteRecipient> = recipients.into();
        self.0 = self.0.clone().expected_output_recipients(native_recipients);
        self
    }

    #[wasm_bindgen(js_name = "withExpectedFutureNotes")]
    pub fn with_expected_future_notes(
        mut self,
        note_details_and_tag: &NoteDetailsAndTagArray,
    ) -> Self {
        let native_note_details_and_tag: Vec<(NativeNoteDetails, NativeNoteTag)> =
            note_details_and_tag.into();
        self.0 = self.0.clone().expected_future_notes(native_note_details_and_tag);
        self
    }

    #[wasm_bindgen(js_name = "extendAdviceMap")]
    pub fn extend_advice_map(mut self, advice_map: &AdviceMap) -> Self {
        let native_advice_map: NativeAdviceMap = advice_map.into();
        self.0 = self.0.clone().extend_advice_map(native_advice_map);
        self
    }

    #[wasm_bindgen(js_name = "withForeignAccounts")]
    pub fn with_foreign_accounts(mut self, foreign_accounts: Vec<ForeignAccount>) -> Self {
        let native_foreign_accounts: Vec<NativeForeignAccount> =
            foreign_accounts.into_iter().map(Into::into).collect();
        self.0 = self.0.clone().foreign_accounts(native_foreign_accounts);
        self
    }

    pub fn build(self) -> TransactionRequest {
        TransactionRequest(self.0.build().unwrap())
    }
}

// CONVERSIONS
// ================================================================================================

impl From<TransactionRequestBuilder> for NativeTransactionRequestBuilder {
    fn from(transaction_request: TransactionRequestBuilder) -> Self {
        transaction_request.0
    }
}

impl From<&TransactionRequestBuilder> for NativeTransactionRequestBuilder {
    fn from(transaction_request: &TransactionRequestBuilder) -> Self {
        transaction_request.0.clone()
    }
}

impl Default for TransactionRequestBuilder {
    fn default() -> Self {
        Self::new()
    }
}
