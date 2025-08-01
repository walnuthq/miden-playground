use miden_objects::transaction::TransactionId as NativeTransactionId;
use wasm_bindgen::prelude::*;

use super::{felt::Felt, rpo_digest::RpoDigest};

#[derive(Clone)]
#[wasm_bindgen]
pub struct TransactionId(NativeTransactionId);

#[wasm_bindgen]
impl TransactionId {
    #[wasm_bindgen(js_name = "asElements")]
    pub fn as_elements(&self) -> Vec<Felt> {
        self.0.as_elements().iter().map(Into::into).collect()
    }

    #[wasm_bindgen(js_name = "asBytes")]
    pub fn as_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }

    #[wasm_bindgen(js_name = "toHex")]
    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }

    pub fn inner(&self) -> RpoDigest {
        self.0.inner().into()
    }
}

// CONVERSIONS
// ================================================================================================

impl From<NativeTransactionId> for TransactionId {
    fn from(native_id: NativeTransactionId) -> Self {
        TransactionId(native_id)
    }
}

impl From<&NativeTransactionId> for TransactionId {
    fn from(native_id: &NativeTransactionId) -> Self {
        TransactionId(*native_id)
    }
}

impl From<TransactionId> for NativeTransactionId {
    fn from(transaction_id: TransactionId) -> Self {
        transaction_id.0
    }
}
