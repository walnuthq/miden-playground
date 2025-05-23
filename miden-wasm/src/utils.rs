use alloc::{format, sync::Arc, vec, vec::Vec};
use assembly::{
    ast::{Module, ModuleKind},
    utils::Deserializable,
    DefaultSourceManager, Library, LibraryPath, Report,
};
use miden_crypto::dsa::rpo_falcon512::PublicKey;
use miden_lib::{
    account::{auth::RpoFalcon512, wallets::BasicWallet},
    transaction::TransactionKernel,
};
use miden_objects::{
    account::{
        Account, AccountCode, AccountComponent, AccountId, AccountStorage, AccountType, StorageSlot,
    },
    asset::{Asset, AssetVault},
    crypto::dsa::rpo_falcon512::SecretKey,
    note::{
        Note, NoteAssets, NoteExecutionHint, NoteInputs, NoteMetadata, NoteRecipient, NoteScript,
        NoteTag, NoteType,
    },
    AccountError, Felt, NoteError, Word,
};
use rand_chacha::{rand_core::SeedableRng, ChaCha20Rng};
use wasm_bindgen::prelude::*;
use web_sys::console;

pub fn create_account_component_library(account_code: &str) -> Result<Library, Report> {
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

fn account_storage_from_components(
    components: &[AccountComponent],
    account_type: AccountType,
) -> Result<AccountStorage, AccountError> {
    let mut storage_slots = match account_type {
        AccountType::FungibleFaucet => vec![StorageSlot::empty_value()],
        AccountType::NonFungibleFaucet => vec![StorageSlot::empty_map()],
        _ => vec![],
    };

    storage_slots.extend(
        components
            .iter()
            .flat_map(|component| component.storage_slots())
            .cloned(),
    );

    AccountStorage::new(storage_slots)
}

pub fn get_account_with_account_code(
    account_code_library: Library,
    account_id: AccountId,
    public_key: Word,
    assets: Vec<Asset>,
    storage: Vec<StorageSlot>,
    wallet: bool,
    auth: bool,
    nonce: u64,
) -> Result<Account, AccountError> {
    let account_component = AccountComponent::new(account_code_library, vec![])
        .unwrap()
        .with_supports_all_types();

    let mut components = vec![];
    if wallet {
        components.push(BasicWallet.into());
    }
    if auth {
        components.push(RpoFalcon512::new(PublicKey::new(public_key)).into());
    }
    components.push(account_component);

    // let (account_code, account_storage) =
    //     Account::initialize_from_components(account_id.account_type(), &components).unwrap();

    let account_code = AccountCode::from_components(&components, account_id.account_type())?;
    let account_storage = account_storage_from_components(&components, account_id.account_type())?;

    let account_vault = AssetVault::new(&assets).unwrap();

    let mut account_storage_slots = account_storage.slots().clone();
    account_storage_slots.extend(storage.into_iter().skip(3));
    let account_storage = AccountStorage::new(account_storage_slots).unwrap();

    Ok(Account::from_parts(
        account_id,
        account_vault,
        account_storage,
        account_code,
        Felt::new(nonce),
    ))
}

pub fn get_note_with_fungible_asset_and_script(
    asset_vec: Vec<Asset>,
    note_script: &str,
    sender_id: AccountId,
    inputs: Vec<Felt>,
    custom_library: Library,
    serial_number: Word,
    tag: NoteTag,
    aux: Felt,
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

    let vault = NoteAssets::new(asset_vec).map_err(|err| err.into())?;

    let metadata = NoteMetadata::new(
        sender_id,
        NoteType::Public,
        tag,
        NoteExecutionHint::Always,
        aux,
    )
    .map_err(|err| err)?;
    let note_inputs = NoteInputs::new(inputs).unwrap();
    let recipient = NoteRecipient::new(serial_number, note_script, note_inputs);

    Ok(Note::new(vault, metadata, recipient))
}

pub fn get_pk_and_authenticator(
    secret_key_bytes: Option<Vec<u8>>,
) -> (
    Word,
    alloc::sync::Arc<dyn miden_tx::auth::TransactionAuthenticator>,
) {
    use alloc::sync::Arc;
    use miden_objects::account::AuthSecretKey;
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
