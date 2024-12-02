#![no_std]
extern crate alloc;

mod account_builder;
mod mock_chain;
mod mock_host;
mod transaction_context;
mod transaction_context_builder;

use crate::transaction_context_builder::TransactionContextBuilder;

use alloc::{
    format,
    string::{String, ToString},
    sync::Arc,
    vec,
    vec::Vec,
};
use assembly::{
    ast::{Module, ModuleKind},
    DefaultSourceManager, Library, LibraryPath, Report,
};
use miden_crypto::dsa::rpo_falcon512::PublicKey;
use rand_chacha::{rand_core::SeedableRng, ChaCha20Rng};

use miden_lib::{
    accounts::{auth::RpoFalcon512, wallets::BasicWallet},
    transaction::TransactionKernel,
};
use miden_objects::{
    accounts::{Account, AccountComponent, AccountId, StorageSlot},
    assets::{Asset, AssetVault, FungibleAsset},
    crypto::dsa::rpo_falcon512::SecretKey,
    notes::{
        Note, NoteAssets, NoteExecutionHint, NoteInputs, NoteMetadata, NoteRecipient, NoteScript,
        NoteType,
    },
    transaction::{TransactionArgs, TransactionScript},
    AccountError, Felt, NoteError, TransactionScriptError, Word, ZERO,
};
use miden_tx::TransactionExecutor;
use wasm_bindgen::prelude::*;
use web_sys::console;

// Added this line to import the necessary libraries for more detailed logging
extern crate console_error_panic_hook;

// CONSTANTS
// ================================================================================================
pub const ACCOUNT_ID_FUNGIBLE_FAUCET_ON_CHAIN: u64 = 0x200000000000001f; // 2305843009213693983
pub const ACCOUNT_ID_SENDER: u64 = 0x800000000000001f; // 9223372036854775839
pub const ACCOUNT_ID_REGULAR_ACCOUNT_UPDATABLE_CODE_OFF_CHAIN: u64 = 0x900000000000003f; // 10376293541461622847

#[derive(Debug)]
#[wasm_bindgen(getter_with_clone)]
pub struct Outputs {
    pub account_delta_storage: String,
    pub account_delta_vault: String,
    pub account_delta_nonce: usize,
    pub account_code_commitment: String,
    pub account_storage_commitment: String,
    pub account_vault_commitment: String,
    pub account_hash: String,
    pub cycle_count: usize,
    pub trace_length: usize,
}

#[wasm_bindgen]
pub fn execute(
    account_code: &str,
    note_script: &str,
    note_inputs: Option<Vec<u64>>,
    transaction_script: &str,
    asset: Option<u64>,
    wallet: bool,
    auth: bool,
) -> Result<Outputs, JsValue> {
    // this line here enables detailed logging, very useful for debugging
    console_error_panic_hook::set_once();

    if let Err(e) = env_logger::try_init() {
        // Logger was already initialized, which is fine
        console::log_1(&format!("Logger was already initialized: {:?}", e).into());
    }

    // Validate input scripts
    if account_code.is_empty()
        || note_script.is_empty()
        || note_inputs.is_none()
        || transaction_script.is_empty()
    {
        return Err(JsValue::from_str("One or more input scripts are empty"));
    }

    // Create assets
    let asset_vec: Vec<Asset> = if let Some(asset) = asset {
        let faucet_id = AccountId::try_from(ACCOUNT_ID_FUNGIBLE_FAUCET_ON_CHAIN)
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

    // Create sender and target account
    let sender_account_id = AccountId::try_from(ACCOUNT_ID_SENDER)
        .map_err(|err| format!("Sender Account id is wrong: {:?}", err))?;

    // CONSTRUCT USER ACCOUNT
    // --------------------------------------------------------------------------------------------
    let target_account_id =
        AccountId::try_from(ACCOUNT_ID_REGULAR_ACCOUNT_UPDATABLE_CODE_OFF_CHAIN)
            .map_err(|err| format!("Target Account id is wrong: {:?}", err))?;
    let (target_pub_key, falcon_auth) = get_new_pk_and_authenticator();

    let account_code_library = create_account_component_library(account_code)
        .map_err(|err| format!("Account library cannot be built: {:?}", err))?;
    let target_account = get_account_with_account_code(
        account_code_library.clone(),
        target_account_id,
        target_pub_key,
        None,
        wallet,
        auth,
    )
    .map_err(|err| format!("Account cannot be built: {:?}", err))?;

    // CONSTRUCT NOTE
    // --------------------------------------------------------------------------------------------
    let note_inputs_felt: Vec<Felt> = note_inputs.unwrap().iter().map(|&x| Felt::new(x)).collect();
    let note = get_note_with_fungible_asset_and_script(
        asset_vec,
        note_script,
        sender_account_id,
        note_inputs_felt,
        account_code_library.clone(),
    )
    .map_err(|err| {
        log::error!("Failed to create note: {:?}", err); // Log the error message
        format!("Note cannot be built: {:?}", err)
    })?;

    // // CONSTRUCT TX ARGS
    // // --------------------------------------------------------------------------------------------
    let assembler = TransactionKernel::assembler().with_debug_mode(true);
    let tx_script = TransactionScript::compile(
        transaction_script,
        [],
        // Add the custom account component as a library to link
        // against so we can reference the account in the transaction script.
        assembler
            .with_library(account_code_library.clone())
            .expect("adding oracle library should not fail")
            .clone(),
    )
    .map_err(|err| JsValue::from_str(&err.to_string()))?;
    log::info!("Tx script compiled");

    let tx_args_target = TransactionArgs::with_tx_script(tx_script);

    // // CONSTRUCT AND EXECUTE TX
    // // --------------------------------------------------------------------------------------------
    let tx_context = TransactionContextBuilder::new(target_account.clone())
        .input_notes(vec![note.clone()])
        .build();

    log::info!("Tx context build");
    log::info!(
        "Mast roots in account: {:?}",
        tx_context.account().code().num_procedures()
    );

    let executor =
        TransactionExecutor::new(Arc::new(tx_context.clone()), Some(falcon_auth.clone()));

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
        .execute_transaction(target_account_id, block_ref, &note_ids, tx_args_target)
        .map_err(|err| {
            log::error!("Failed to create execution: {:?}", err); // Log the error message
            format!("Execution failed: {:?}", err)
        })?;

    // Prove, serialize/deserialize and verify the transaction
    // assert!(prove_and_verify_transaction(executed_transaction.clone()).is_ok());

    let nonce: usize = executed_transaction
        .account_delta()
        .nonce()
        .map(|felt| felt.as_int().try_into().unwrap()) // Convert the Felt to usize if it exists
        .unwrap_or(0);

    let result = Outputs {
        account_delta_storage: format!("{:?}", executed_transaction.account_delta().storage()),
        account_delta_vault: format!("{:?}", executed_transaction.account_delta().vault()),
        account_delta_nonce: nonce,
        account_code_commitment: executed_transaction
            .final_account()
            .code_commitment()
            .to_hex(),
        account_storage_commitment: executed_transaction
            .final_account()
            .storage_commitment()
            .to_hex(),
        account_vault_commitment: executed_transaction.final_account().vault_root().to_hex(),
        account_hash: executed_transaction.final_account().hash().to_hex(),
        cycle_count: 67000_usize,
        trace_length: 67000_usize.next_power_of_two(),
    };

    Ok(result)
}

fn create_account_component_library(account_code: &str) -> Result<Library, Report> {
    let assembler = TransactionKernel::assembler().with_debug_mode(true);
    let source_manager = Arc::new(DefaultSourceManager::default());

    let account_component_module = Module::parser(ModuleKind::Library)
        .parse_str(
            LibraryPath::new("account_component::account_module").unwrap(),
            account_code,
            &source_manager,
        )
        .map_err(|err| err)?;

    let account_library = assembler
        .assemble_library([account_component_module])
        .map_err(|err| err)?;

    Ok(account_library)
}

pub fn get_account_with_account_code(
    account_code_library: Library,
    account_id: AccountId,
    public_key: Word,
    assets: Option<Asset>,
    wallet: bool,
    auth: bool,
) -> Result<Account, AccountError> {
    log::info!("Building account");

    // This component supports all types of accounts for testing purposes.
    let account_component = AccountComponent::new(
        account_code_library,
        vec![StorageSlot::Value(Word::default()); 200],
    )
    .unwrap()
    .with_supports_all_types();

    let mut components = vec![account_component];
    if wallet {
        components.push(BasicWallet.into());
    }
    if auth {
        components.push(RpoFalcon512::new(PublicKey::new(public_key)).into());
    }

    let (account_code, account_storage) = Account::initialize_from_components(
        account_id.account_type(),
        &components,
    )
    .unwrap();

    let account_vault = match assets {
        Some(asset) => AssetVault::new(&[asset]).unwrap(),
        None => AssetVault::new(&[]).unwrap(),
    };

    Ok(Account::from_parts(
        account_id,
        account_vault,
        account_storage,
        account_code,
        Felt::new(1),
    ))
}

pub fn get_note_with_fungible_asset_and_script(
    asset_vec: Vec<Asset>,
    note_script: &str,
    sender_id: AccountId,
    inputs: Vec<Felt>,
    custom_library: Library,
) -> Result<Note, NoteError> {
    log::info!("Building note");
    let assembler = TransactionKernel::assembler()
        .with_debug_mode(true)
        .with_library(custom_library)
        .map_err(|err| {
            log::error!("Failed to create note assembler with library: {:?}", err); // Log the error message
            err
        })
        .unwrap();

    let note_script = NoteScript::compile(note_script, assembler).map_err(|err| {
        log::error!("Failed to compile note script: {:?}", err); // Log the error message
        err
    })?;
    log::info!("Note script compiled");
    const SERIAL_NUM: Word = [Felt::new(1), Felt::new(2), Felt::new(3), Felt::new(4)];

    let vault = NoteAssets::new(asset_vec).map_err(|err| err.into())?;

    let metadata = NoteMetadata::new(
        sender_id,
        NoteType::Public,
        1.into(),
        NoteExecutionHint::Always,
        ZERO,
    )
    .map_err(|err| err)?;
    let note_inputs = NoteInputs::new(inputs).unwrap();
    let recipient = NoteRecipient::new(SERIAL_NUM, note_script, note_inputs);

    Ok(Note::new(vault, metadata, recipient))
}

pub fn build_transaction_script(
    transaction_script: &str,
) -> Result<TransactionScript, TransactionScriptError> {
    let compiled_tx_script =
        TransactionScript::compile(transaction_script, [], TransactionKernel::assembler())
            .map_err(|err| err.into())?;
    Ok(compiled_tx_script)
}

pub fn get_new_pk_and_authenticator() -> (
    Word,
    alloc::sync::Arc<dyn miden_tx::auth::TransactionAuthenticator>,
) {
    use alloc::sync::Arc;

    use miden_objects::accounts::AuthSecretKey;
    use miden_tx::auth::{BasicAuthenticator, TransactionAuthenticator};

    let seed = [0_u8; 32];
    let mut rng = ChaCha20Rng::from_seed(seed);

    let sec_key = SecretKey::with_rng(&mut rng);
    let pub_key: Word = sec_key.public_key().into();

    let authenticator = BasicAuthenticator::<ChaCha20Rng>::new_with_rng(
        &[(pub_key, AuthSecretKey::RpoFalcon512(sec_key))],
        rng,
    );
    (
        pub_key,
        Arc::new(authenticator) as Arc<dyn TransactionAuthenticator>,
    )
}

// TESTS
// ================================================================================================
/// Basic tests for the Rust part
/// Tests are run with `cargo test`
///
#[test]
pub fn test_execute_wasm() {
    let custom_account_code = r#"
    use.miden::account
    use.std::sys

    export.custom
        push.1 drop
    end

    export.custom_set_item
        exec.account::set_item
        exec.sys::truncate_stack
    end
    "#;

    let note_script = r#"
    use.miden::account
    use.miden::note
    use.miden::contracts::wallets::basic->wallet
    use.account_component::account_module

    # ERRORS
    # =================================================================================================

    # P2ID script expects exactly 1 note input
    const.ERR_P2ID_WRONG_NUMBER_OF_INPUTS=0x00020050

    # P2ID's target account address and transaction address do not match
    const.ERR_P2ID_TARGET_ACCT_MISMATCH=0x00020051

    #! Helper procedure to add all assets of a note to an account.
    #!
    #! Inputs: []
    #! Outputs: []
    #!
    proc.add_note_assets_to_account
        push.0 exec.note::get_assets
        # => [num_of_assets, 0 = ptr, ...]

        # compute the pointer at which we should stop iterating
        dup.1 add
        # => [end_ptr, ptr, ...]

        # pad the stack and move the pointer to the top
        padw movup.5
        # => [ptr, 0, 0, 0, 0, end_ptr, ...]

        # compute the loop latch
        dup dup.6 neq
        # => [latch, ptr, 0, 0, 0, 0, end_ptr, ...]

        while.true
            # => [ptr, 0, 0, 0, 0, end_ptr, ...]

            # save the pointer so that we can use it later
            dup movdn.5
            # => [ptr, 0, 0, 0, 0, ptr, end_ptr, ...]

            # load the asset and add it to the account
            mem_loadw call.wallet::receive_asset
            # => [ASSET, ptr, end_ptr, ...]

            # increment the pointer and compare it to the end_ptr
            movup.4 add.1 dup dup.6 neq
            # => [latch, ptr+1, ASSET, end_ptr, ...]
        end

        # clear the stack
        drop dropw drop
    end

    # Pay-to-ID script: adds all assets from the note to the account, assuming ID of the account
    # matches target account ID specified by the note inputs.
    #
    # Requires that the account exposes: miden::contracts::wallets::basic::receive_asset procedure.
    #
    # Inputs: [SCRIPT_ROOT]
    # Outputs: []
    #
    # Note inputs are assumed to be as follows:
    # - target_account_id is the ID of the account for which the note is intended.
    #
    # FAILS if:
    # - Account does not expose miden::contracts::wallets::basic::receive_asset procedure.
    # - Account ID of executing account is not equal to the Account ID specified via note inputs.
    # - The same non-fungible asset already exists in the account.
    # - Adding a fungible asset would result in amount overflow, i.e., the total amount would be
    #   greater than 2^63.
    begin
        # drop the note script root
        dropw
        # => []

        # store the note inputs to memory starting at address 0
        push.0 exec.note::get_inputs
        # => [num_inputs, inputs_ptr]

        # make sure the number of inputs is 1
        eq.1 assert.err=ERR_P2ID_WRONG_NUMBER_OF_INPUTS
        # => [inputs_ptr]

        # read the target account id from the note inputs
        mem_load
        # => [target_account_id]

        exec.account::get_id
        # => [account_id, target_account_id, ...]

        # ensure account_id = target_account_id, fails otherwise
        assert_eq.err=ERR_P2ID_TARGET_ACCT_MISMATCH
        # => [...]

        exec.add_note_assets_to_account
        # => [...]

        call.account_module::custom
        push.3.3.3.3 push.1 call.account_module::custom_set_item dropw dropw
    end
    "#;

    let note_inputs = vec![10376293541461622847u64];

    let transaction_script = r#"
        begin
            call.::miden::contracts::auth::basic::auth_tx_rpo_falcon512
        end
    "#;

    // Call the execute function
    let result = execute(
        custom_account_code,
        note_script,
        Some(note_inputs),
        transaction_script,
        Some(100u64),
        true,
        true,
    );

    // Ensure the result is Ok
    assert!(result.is_ok(), "Execution failed: {:?}", result);
}
