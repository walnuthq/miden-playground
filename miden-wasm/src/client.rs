use crate::{
    transaction_context_builder::TransactionContextBuilder,
    utils::{
        create_account_component_library, get_account_with_account_code,
        get_note_with_fungible_asset_and_script, get_pk_and_authenticator,
    },
};

use alloc::{
    format,
    string::{String, ToString},
    sync::Arc,
    vec,
    vec::Vec,
};
use assembly::Library;
use miden_crypto::utils::Serializable;
use miden_lib::transaction::TransactionKernel;
use miden_objects::{
    accounts::{Account, AccountId},
    assets::{Asset, FungibleAsset},
    notes::Note,
    transaction::{TransactionArgs, TransactionScript},
    Felt,
};
use miden_tx::{auth::TransactionAuthenticator, TransactionExecutor};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(getter_with_clone)]
pub struct ClientAccount {
    pub id_hex: String,
    account: Account,
    falcon_auth: Arc<dyn TransactionAuthenticator>,
    account_code_library: Library,
}

#[wasm_bindgen]
pub fn generate_secret_key() -> Vec<u8> {
    use miden_objects::crypto::dsa::rpo_falcon512::SecretKey;
    use rand_chacha::{rand_core::SeedableRng, ChaCha20Rng};

    let seed = [0_u8; 32];
    let mut rng = ChaCha20Rng::from_seed(seed);

    let sec_key = SecretKey::with_rng(&mut rng);

    let sec_key_bytes = sec_key.to_bytes();

    sec_key_bytes
}

#[wasm_bindgen]
impl ClientAccount {
    #[wasm_bindgen(constructor)]
    pub fn new(
        secret_key: Vec<u8>,
        account_id: u64,
        account_code: &str,
        wallet: bool,
        auth: bool,
    ) -> Result<Self, JsValue> {
        let account_code_library = create_account_component_library(account_code)
            .map_err(|err| format!("Account library cannot be built: {:?}", err))?;

        let target_account_id = AccountId::try_from(account_id)
            .map_err(|err| format!("Target Account id is wrong: {:?}", err))?;

        let (target_pub_key, falcon_auth) = get_pk_and_authenticator(Some(secret_key));

        let target_account = get_account_with_account_code(
            account_code_library.clone(),
            target_account_id,
            target_pub_key,
            None,
            wallet,
            auth,
        )
        .map_err(|err| format!("Account cannot be built: {:?}", err))?;

        Ok(Self {
            id_hex: target_account_id.to_hex(),
            account: target_account,
            falcon_auth,
            account_code_library,
        })
    }

    #[wasm_bindgen]
    pub fn create_note(
        &self,
        faucet_id: u64,
        note_inputs: Vec<u64>,
        note_script: &str,
        asset: Option<u64>,
    ) -> Result<ClientNote, JsValue> {
        // Create assets
        let asset_vec: Vec<Asset> = if let Some(asset) = asset {
            let faucet_id = AccountId::try_from(faucet_id)
                .map_err(|err| format!("faucet id is wrong: {:?}", err))?;

            let fungible_asset: Asset = FungibleAsset::new(faucet_id, asset)
                .map_err(|err| format!("fungible asset is wrong: {:?}", err))?
                .into();

            // Return a vector with the single asset
            vec![fungible_asset]
        } else {
            // Return an empty vec if no asset is provided
            vec![]
        };

        let note_inputs_felt: Vec<Felt> = note_inputs.iter().map(|&x| Felt::new(x)).collect();
        let note = get_note_with_fungible_asset_and_script(
            asset_vec,
            note_script,
            self.account.id(),
            note_inputs_felt,
            self.account_code_library.clone(),
        )
        .map_err(|err| {
            log::error!("Failed to create note: {:?}", err); // Log the error message
            format!("Note cannot be built: {:?}", err)
        })?;
        Ok(ClientNote::new(note))
    }

    #[wasm_bindgen]
    pub fn consume_note(
        &mut self,
        transaction_script: &str,
        note: ClientNote,
    ) -> Result<(), JsValue> {
        console_error_panic_hook::set_once();
        // // CONSTRUCT TX ARGS
        // // --------------------------------------------------------------------------------------------
        let assembler = TransactionKernel::assembler().with_debug_mode(true);
        let tx_script = TransactionScript::compile(
            transaction_script,
            [],
            // Add the custom account component as a library to link
            // against so we can reference the account in the transaction script.
            assembler
                .with_library(self.account_code_library.clone())
                .expect("adding oracle library should not fail")
                .clone(),
        )
        .map_err(|err| JsValue::from_str(&err.to_string()))?;

        let tx_args_target = TransactionArgs::with_tx_script(tx_script);

        // // CONSTRUCT AND EXECUTE TX
        // // --------------------------------------------------------------------------------------------
        let tx_context = TransactionContextBuilder::new(self.account.clone())
            .input_notes(vec![note.note.clone()])
            .build();

        log::info!("Tx context build");
        log::info!(
            "Mast roots in account: {:?}",
            tx_context.account().code().num_procedures()
        );

        let executor =
            TransactionExecutor::new(Arc::new(tx_context.clone()), Some(self.falcon_auth.clone()));

        let block_ref = tx_context.tx_inputs().block_header().block_num();

        let note_ids = tx_context
            .tx_inputs()
            .input_notes()
            .iter()
            .map(|note| note.id())
            .collect::<Vec<_>>();

        log::info!("Before execution");

        // Execute the transaction and get the witness
        let executed_transaction = executor
            .execute_transaction(self.account.id(), block_ref, &note_ids, tx_args_target)
            .map_err(|err| {
                log::error!("Failed to create execution: {:?}", err); // Log the error message
                format!("Execution failed: {:?}", err)
            })?;

        // Prove, serialize/deserialize and verify the transaction
        // assert!(prove_and_verify_transaction(executed_transaction.clone()).is_ok());

        // let nonce: usize = executed_transaction
        //     .account_delta()
        //     .nonce()
        //     .map(|felt| felt.as_int().try_into().unwrap()) // Convert the Felt to usize if it exists
        //     .unwrap_or(0);

        self.account
            .apply_delta(executed_transaction.account_delta())
            .map_err(|err| format!("Failed to apply delta: {:?}", err))?;

        Ok(())
    }

    #[wasm_bindgen]
    pub fn assets(&self) -> Vec<ClientAsset> {
        let assets = self.account.vault().assets();
        assets.map(|asset| ClientAsset::new(asset)).collect()
    }
}

#[wasm_bindgen]
pub struct ClientNote {
    note: Note,
}

#[wasm_bindgen]
impl ClientNote {
    fn new(note: Note) -> Self {
        Self { note }
    }

    #[wasm_bindgen]
    pub fn id(&self) -> String {
        self.note.id().to_hex()
    }
}

#[wasm_bindgen]
pub struct ClientAsset {
    asset: Asset,
}

#[wasm_bindgen]
impl ClientAsset {
    fn new(asset: Asset) -> Self {
        Self { asset }
    }

    #[wasm_bindgen]
    pub fn faucet_id(&self) -> String {
        self.asset.faucet_id().to_hex()
    }

    #[wasm_bindgen]
    pub fn amount(&self) -> u64 {
        match self.asset {
            Asset::Fungible(fungible_asset) => fungible_asset.amount(),
            Asset::NonFungible(_) => 0,
        }
    }
}
