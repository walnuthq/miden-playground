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
    utils::Deserializable,
    DefaultSourceManager, Library, LibraryPath, Report,
};
use miden_crypto::{
    dsa::rpo_falcon512::PublicKey,
    rand::{FeltRng, RpoRandomCoin},
};
use rand::Rng;
use rand_chacha::{rand_core::SeedableRng, ChaCha20Rng};

use miden_lib::{
    accounts::{auth::RpoFalcon512, wallets::BasicWallet},
    notes::utils::{build_p2id_recipient, build_swap_tag},
    transaction::TransactionKernel,
};
use miden_objects::{
    accounts::{Account, AccountComponent, AccountHeader, AccountId, AccountType, StorageSlot},
    assets::{Asset, AssetVault, FungibleAsset},
    crypto::dsa::rpo_falcon512::SecretKey,
    notes::{
        Note, NoteAssets, NoteExecutionHint, NoteExecutionMode, NoteInputs, NoteMetadata,
        NoteRecipient, NoteScript, NoteTag, NoteType,
    },
    transaction::{OutputNotes, TransactionArgs, TransactionScript},
    AccountError, Felt, NoteError, TransactionScriptError, Word, ZERO,
};
use miden_tx::TransactionExecutor;
use wasm_bindgen::prelude::*;
use web_sys::{console, js_sys};

// Added this line to import the necessary libraries for more detailed logging
extern crate console_error_panic_hook;

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
    assets: Vec<Asset>,
    wallet: bool,
    auth: bool,
) -> Result<Account, AccountError> {
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

    let (account_code, account_storage) =
        Account::initialize_from_components(account_id.account_type(), &components).unwrap();

    let account_vault = AssetVault::new(&assets).unwrap();

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
    let assembler = TransactionKernel::assembler()
        .with_debug_mode(true)
        .with_library(custom_library)
        .map_err(|err| {
            log::error!("Failed to create note assembler with library: {:?}", err);
            err
        })
        .unwrap();

    let note_script = NoteScript::compile(note_script, assembler).map_err(|err| {
        log::error!("Failed to compile note script: {:?}", err);
        err
    })?;

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

pub fn get_pk_and_authenticator(
    secret_key_bytes: Option<Vec<u8>>,
) -> (
    Word,
    alloc::sync::Arc<dyn miden_tx::auth::TransactionAuthenticator>,
) {
    use alloc::sync::Arc;
    use miden_objects::accounts::AuthSecretKey;
    use miden_tx::auth::{BasicAuthenticator, TransactionAuthenticator};

    let seed = [0_u8; 32];
    let mut rng = ChaCha20Rng::from_seed(seed);

    let sec_key = if let Some(secret_key_bytes) = secret_key_bytes {
        SecretKey::read_from_bytes(&secret_key_bytes).unwrap()
    } else {
        SecretKey::with_rng(&mut rng)
    };

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

#[wasm_bindgen]
pub struct AssetData {
    pub faucet_id: u64,
    pub amount: u64,
}

#[wasm_bindgen]
impl AssetData {
    #[wasm_bindgen(constructor)]
    pub fn new(faucet_id: u64, amount: u64) -> Self {
        Self { faucet_id, amount }
    }
}

impl From<AssetData> for Asset {
    fn from(asset: AssetData) -> Self {
        Self::Fungible(
            FungibleAsset::new(AccountId::try_from(asset.faucet_id).unwrap(), asset.amount)
                .unwrap(),
        )
    }
}

#[wasm_bindgen]
pub struct NoteData {
    assets: Vec<AssetData>,
    inputs: Vec<u64>,
    script: String,
    sender_id: u64,
    sender_script: String,
}

#[wasm_bindgen]
impl NoteData {
    #[wasm_bindgen(constructor)]
    pub fn new(
        assets: Vec<AssetData>,
        inputs: Vec<u64>,
        script: String,
        sender_id: u64,
        sender_script: String,
    ) -> Self {
        Self {
            assets,
            inputs,
            script,
            sender_id,
            sender_script,
        }
    }
}

fn serialize_assets(assets: &[Asset]) -> js_sys::Array {
    let assets_array = js_sys::Array::new();

    for asset in assets {
        let asset_obj = js_sys::Object::new();
        match asset {
            Asset::Fungible(asset) => {
                js_sys::Reflect::set(
                    &asset_obj,
                    &"faucetId".into(),
                    &JsValue::from(u64::from(asset.faucet_id())),
                )
                .unwrap();
                js_sys::Reflect::set(
                    &asset_obj,
                    &"faucetIdHex".into(),
                    &JsValue::from(asset.faucet_id().to_hex()),
                )
                .unwrap();
                js_sys::Reflect::set(&asset_obj, &"amount".into(), &JsValue::from(asset.amount()))
                    .unwrap();
            }
            Asset::NonFungible(asset) => {
                js_sys::Reflect::set(
                    &asset_obj,
                    &"faucetId".into(),
                    &JsValue::from(u64::from(asset.faucet_id())),
                )
                .unwrap();
                js_sys::Reflect::set(
                    &asset_obj,
                    &"faucetIdHex".into(),
                    &JsValue::from(asset.faucet_id().to_hex()),
                )
                .unwrap();
            }
        }
        assets_array.push(&asset_obj);
    }

    assets_array
}

fn serialize_execution_output(
    account: &Account,
    final_account: &AccountHeader,
    output_notes: &OutputNotes,
) -> JsValue {
    let assets: Vec<Asset> = account.vault().assets().collect();
    let assets_array = serialize_assets(&assets);

    let account_hash = final_account.hash().to_hex();
    let code_commitment = final_account.code_commitment().to_hex();
    let storage_commitment = final_account.storage_commitment().to_hex();
    let vault_root = final_account.vault_root().to_hex();
    let nonce = final_account.nonce().as_int();

    let output_notes_array = js_sys::Array::new();
    for note in output_notes.iter() {
        let note_obj = js_sys::Object::new();
        js_sys::Reflect::set(&note_obj, &"id".into(), &JsValue::from(note.id().to_hex())).unwrap();
        if let Some(note_assets) = note.assets() {
            let assets: Vec<Asset> = note_assets.iter().map(|a| a.clone()).collect();
            js_sys::Reflect::set(&note_obj, &"assets".into(), &serialize_assets(&assets)).unwrap();
        }
        output_notes_array.push(&note_obj);
    }

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(&obj, &"outputNotes".into(), &output_notes_array).unwrap();
    js_sys::Reflect::set(&obj, &"assets".into(), &assets_array).unwrap();
    js_sys::Reflect::set(&obj, &"accountHash".into(), &JsValue::from(account_hash)).unwrap();
    js_sys::Reflect::set(
        &obj,
        &"codeCommitment".into(),
        &JsValue::from(code_commitment),
    )
    .unwrap();
    js_sys::Reflect::set(
        &obj,
        &"storageCommitment".into(),
        &JsValue::from(storage_commitment),
    )
    .unwrap();
    js_sys::Reflect::set(&obj, &"vaultRoot".into(), &JsValue::from(vault_root)).unwrap();
    js_sys::Reflect::set(&obj, &"nonce".into(), &JsValue::from(nonce)).unwrap();
    obj.into()
}

#[wasm_bindgen]
pub fn generate_account_id(seed: Vec<u8>) -> u64 {
    let seed_array: [u8; 32] = seed.try_into().expect("seed must be 32 bytes");
    AccountId::new_dummy(seed_array, AccountType::RegularAccountUpdatableCode).into()
}

#[wasm_bindgen]
pub fn generate_faucet_id(seed: Vec<u8>) -> u64 {
    let seed_array: [u8; 32] = seed.try_into().expect("seed must be 32 bytes");
    AccountId::new_dummy(seed_array, AccountType::FungibleFaucet).into()
}

#[wasm_bindgen]
pub fn execute_transaction(
    transaction_script: &str,
    receiver_account_code: &str,
    receiver_secret_key: Vec<u8>,
    receiver_account_id: u64,
    receiver_assets: Vec<AssetData>,
    receiver_wallet_enabled: bool,
    receiver_auth_enabled: bool,
    notes: Vec<NoteData>,
) -> Result<JsValue, JsValue> {
    let notes = notes
        .into_iter()
        .map(|note| {
            let note_assets: Vec<Asset> = note
                .assets
                .into_iter()
                .map(|asset_wrapper| {
                    let faucet_id = AccountId::try_from(asset_wrapper.faucet_id)
                        .map_err(|err| format!("faucet id is wrong: {:?}", err))?;
                    console::log_1(&format!("Faucet ID: {:?}", faucet_id).into());

                    let fungible_asset: Asset = FungibleAsset::new(faucet_id, asset_wrapper.amount)
                        .map_err(|err| format!("fungible asset is wrong: {:?}", err))?
                        .into();
                    console::log_1(&format!("Fungible asset created: {:?}", fungible_asset).into());

                    Ok(fungible_asset)
                })
                .collect::<Result<Vec<Asset>, String>>()?;
            let note_inputs: Vec<Felt> = note.inputs.iter().map(|&x| Felt::new(x)).collect();

            let sender_account_id = AccountId::try_from(note.sender_id)
                .map_err(|err| format!("Sender Account id is wrong: {:?}", err))?;

            let sender_account_code_library =
                create_account_component_library(note.sender_script.as_str())
                    .map_err(|err| format!("Account library cannot be built: {:?}", err))?;

            let note = get_note_with_fungible_asset_and_script(
                note_assets,
                note.script.as_str(),
                sender_account_id,
                note_inputs,
                sender_account_code_library.clone(),
            )
            .map_err(|err| {
                console::log_1(&format!("Note creation failed: {:?}", err).into());
                format!("Note cannot be built: {:?}", err)
            })?;

            Ok(note)
        })
        .collect::<Result<Vec<Note>, String>>()?;

    let receiver_account_code_library = create_account_component_library(receiver_account_code)
        .map_err(|err| format!("Account library cannot be built: {:?}", err))?;

    let receiver_account_id = AccountId::try_from(receiver_account_id)
        .map_err(|err| format!("Target Account id is wrong: {:?}", err))?;

    let (pub_key, falcon_auth) = get_pk_and_authenticator(Some(receiver_secret_key));

    let mut receiver_account = get_account_with_account_code(
        receiver_account_code_library.clone(),
        receiver_account_id,
        pub_key,
        receiver_assets.into_iter().map(|a| a.into()).collect(),
        receiver_wallet_enabled,
        receiver_auth_enabled,
    )
    .map_err(|err| {
        console::log_1(&format!("Receiver account creation failed: {:?}", err).into());
        format!("Account cannot be built: {:?}", err)
    })?;

    let assembler = TransactionKernel::assembler().with_debug_mode(true);

    let tx_script = TransactionScript::compile(
        transaction_script,
        [],
        assembler
            .with_library(receiver_account_code_library.clone())
            .expect("adding oracle library should not fail")
            .clone(),
    )
    .map_err(|err| {
        console::log_1(&format!("Transaction script compilation failed: {:?}", err).into());
        JsValue::from_str(&err.to_string())
    })?;

    let tx_args_target = TransactionArgs::with_tx_script(tx_script.clone());

    let tx_context = TransactionContextBuilder::new(receiver_account.clone())
        .input_notes(notes.clone())
        .build();

    let executor =
        TransactionExecutor::new(Arc::new(tx_context.clone()), Some(falcon_auth.clone()));

    let block_ref = tx_context.tx_inputs().block_header().block_num();

    let note_ids = tx_context
        .tx_inputs()
        .input_notes()
        .iter()
        .map(|note| note.id())
        .collect::<Vec<_>>();

    let executed_transaction = executor
        .execute_transaction(receiver_account_id, block_ref, &note_ids, tx_args_target)
        .map_err(|err| {
            console::log_1(&format!("Transaction execution failed: {:?}", err).into());
            format!("Execution failed: {:?}", err)
        })?;

    receiver_account
        .apply_delta(executed_transaction.account_delta())
        .map_err(|err| {
            console::log_1(&format!("Failed to apply account delta: {:?}", err).into());
            format!("Account delta cannot be applied: {:?}", err)
        })?;

    let final_account = executed_transaction.final_account();
    let output_notes = executed_transaction.output_notes();

    Ok(serialize_execution_output(
        &receiver_account,
        &final_account,
        &output_notes,
    ))
}

#[wasm_bindgen]
pub fn create_swap_note_inputs(
    seed: Vec<u8>,
    sender_account_id: u64,
    // offered_asset: AssetData,
    requested_asset: AssetData,
) -> Result<Vec<u64>, JsValue> {
    let sender = AccountId::try_from(sender_account_id).unwrap();
    // let offered_asset: Asset = offered_asset.into();
    let requested_asset: Asset = requested_asset.into();

    let mut rng = ChaCha20Rng::from_seed(seed.try_into().unwrap());
    let coin_seed: [u64; 4] = rng.gen();
    let mut rng = RpoRandomCoin::new(coin_seed.map(Felt::new));

    let payback_serial_num = rng.draw_word();
    let payback_recipient = build_p2id_recipient(sender, payback_serial_num).unwrap();

    let payback_recipient_word: Word = payback_recipient.digest().into();
    let requested_asset_word: Word = requested_asset.into();
    let payback_tag = NoteTag::from_account_id(sender, NoteExecutionMode::Local).unwrap();

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
    .unwrap();

    // build the tag for the SWAP use case
    // let tag = build_swap_tag(NoteType::Private, &offered_asset, &requested_asset).unwrap();
    // let serial_num = rng.draw_word();

    let inputs_u64 = inputs
        .values()
        .iter()
        .map(|x| x.as_int())
        .collect::<Vec<u64>>();

    Ok(inputs_u64)
}
