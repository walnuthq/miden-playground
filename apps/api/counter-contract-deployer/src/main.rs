use base64::prelude::*;
use miden_client::{
    ClientError, Felt, Word,
    account::{
        AccountBuilder, AccountComponent, AccountStorageMode, AccountType,
        component::{InitStorageData, NoAuth, StorageValueName},
    },
    address::{Address, AddressInterface, NetworkId, RoutingParameters},
    builder::ClientBuilder,
    keystore::FilesystemKeyStore,
    rpc::{Endpoint, GrpcClient},
    transaction::{TransactionRequestBuilder, TransactionScript},
};
use miden_client_sqlite_store::ClientBuilderSqliteExt;
use miden_mast_package::Package;
use rand::RngCore;
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;
use winter_utils::Deserializable;

// cargo run --release accountIdPrefix accountIdSuffix masp
#[tokio::main]
async fn main() -> Result<(), ClientError> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 4 {
        eprintln!(
            "Usage: {} <account-id-prefix> <account-id-suffix> <masp>",
            args[0]
        );
        std::process::exit(1);
    }
    // Initialize client
    let endpoint = Endpoint::testnet();
    let timeout_ms = 10_000;
    let rpc_api = Arc::new(GrpcClient::new(&endpoint, timeout_ms));
    let keystore = FilesystemKeyStore::new("./keystore".into()).unwrap().into();

    let mut client = ClientBuilder::new()
        .rpc(rpc_api)
        .sqlite_store("./store.sqlite3".into())
        .authenticator(keystore)
        // .in_debug_mode(true.into())
        .build()
        .await?;

    let mut sync_summary = client.sync_state().await?;
    println!("Latest block: {}", sync_summary.block_num);

    let account_id_prefix = &args[1];
    let account_id_suffix = &args[2];
    let masp = &args[3];

    let package_bytes = BASE64_STANDARD.decode(masp).unwrap();
    let package = Package::read_from_bytes(&package_bytes).unwrap();

    //
    let mut exports = package.manifest.exports();
    let increment_count = exports
        .find(|export| export.name.name.to_string().ends_with("increment-count"))
        .expect("increment-count export not found");
    println!("{}", increment_count.digest.to_hex());
    println!("counter-contract exports:");
    for export in exports {
        println!(
            "procedure name: {} - digest: {}",
            export.name.name,
            export.digest.to_hex()
        );
    }
    //
    let init_storage_data = InitStorageData::new(
        BTreeMap::new(),
        [(
            StorageValueName::new("count_map").unwrap(),
            vec![(
                Word::new([Felt::new(0), Felt::new(0), Felt::new(0), Felt::new(1)]),
                Word::empty(),
            )],
        )],
    );
    let account_component =
        AccountComponent::from_package_with_init_data(&package, &init_storage_data)
            .unwrap()
            .with_supported_types(BTreeSet::from_iter([
                AccountType::RegularAccountUpdatableCode,
            ]));

    let mut init_seed = [0_u8; 32];
    client.rng().fill_bytes(&mut init_seed);

    let account = AccountBuilder::new(init_seed)
        .account_type(AccountType::RegularAccountUpdatableCode)
        .storage_mode(AccountStorageMode::Public)
        .with_auth_component(NoAuth)
        .with_component(account_component)
        .build()
        .unwrap();
    client.add_account(&account, false).await?;

    let address = Address::new(account.id())
        .with_routing_parameters(RoutingParameters::new(AddressInterface::BasicWallet))
        .unwrap()
        .encode(NetworkId::Testnet);
    println!("counter address: {}", address);

    // let counter_init = account
    //     .storage()
    //     .get_item(0)
    //     .unwrap()
    //     .last()
    //     .unwrap()
    //     .as_int();
    // println!("counter init: {}", counter_init);

    // let tx_script_bytes = fs::read("/Users/saimeunt/miden/counter-contract/counter-contract-tx-script/target/miden/release/counter_contract_tx_script.masp").unwrap();
    // let tx_script_package = Package::read_from_bytes(&tx_script_bytes).unwrap();
    // let tx_script_program = tx_script_package.unwrap_program();
    // let tx_script = TransactionScript::from_parts(
    //     tx_script_program.mast_forest().clone(),
    //     tx_script_program.entrypoint(),
    // );

    // let tx_request = TransactionRequestBuilder::new()
    //     .custom_script(tx_script)
    //     .build()
    //     .unwrap();

    // let tx_id = client
    //     .submit_new_transaction(account.id(), tx_request)
    //     .await?;

    // println!("tx_id: {}", tx_id);

    // sync_summary = client.sync_state().await.unwrap();
    // println!("Latest block: {}", sync_summary.block_num);

    // let counter = client.get_account(account.id()).await?.unwrap();

    // let counter_value = counter
    //     .account()
    //     .storage()
    //     .get_item(0)
    //     .unwrap()
    //     .last()
    //     .unwrap()
    //     .as_int();

    // println!("counter after tx: {}", counter_value);

    Ok(())
}
