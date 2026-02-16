use base64::prelude::*;
use miden_protocol::{
    account::Account,
    note::Note,
    vm::{Package, PackageExport},
};
use std::process::ExitCode;
use winter_utils::Deserializable;

// cargo run --release
fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 4 {
        eprintln!(
            "Usage: {} <account-component|note|transaction> <resource> <masp>",
            args[0]
        );
        return ExitCode::FAILURE;
    }
    // Initialize client
    // let endpoint = Endpoint::testnet();
    // let timeout_ms = 10_000;
    // let rpc_api = Arc::new(GrpcClient::new(&endpoint, timeout_ms));
    // let keystore = FilesystemKeyStore::new("./keystore".into()).unwrap().into();

    // let mut client = ClientBuilder::new()
    //     .rpc(rpc_api)
    //     .sqlite_store("./store.sqlite3".into())
    //     .authenticator(keystore)
    //     // .in_debug_mode(true.into())
    //     .build()
    //     .await?;

    // let mut sync_summary = client.sync_state().await.unwrap();
    // println!("Latest block: {}", sync_summary.block_num);

    let resource_type = &args[1];
    let resource = &args[2];
    let masp = &args[3];

    let resource_bytes = BASE64_STANDARD.decode(resource).unwrap();

    let package_bytes = BASE64_STANDARD.decode(masp).unwrap();
    let package = Package::read_from_bytes(&package_bytes).unwrap();

    match resource_type.as_str() {
        "account-component" => {
            let account = Account::read_from_bytes(&resource_bytes).unwrap();

            let exports_len_iter = package.manifest.exports();
            let mut exports_length = 0;
            for _ in exports_len_iter {
                exports_length += 1;
            }

            if exports_length == 0 {
                return ExitCode::FAILURE;
            }

            let exports = package.manifest.exports();
            // let verified = exports.all(|export| account.code().has_procedure(export.digest));
            //let verified = exports.filter(|export| export.is_procedure());
            let mut procedures = exports.filter_map(|export| match export {
                PackageExport::Procedure(procedure) => Some(procedure),
                _ => None,
            });
            let verified =
                procedures.all(|procedure| account.code().has_procedure(procedure.digest));
            // println!("verified: {}", verified);
            // println!("{}", account_id.to_bech32(NetworkId::Testnet));
            //std::process::exit(not_verified.into());
            return if verified {
                ExitCode::SUCCESS
            } else {
                ExitCode::FAILURE
            };
        }
        "note" => {
            let note = Note::read_from_bytes(&resource_bytes).unwrap();

            let verified = package.digest() == note.script().root();
            return if verified {
                ExitCode::SUCCESS
            } else {
                ExitCode::FAILURE
            };
        }
        "transaction" => {
            let verified = false;
            return if verified {
                ExitCode::SUCCESS
            } else {
                ExitCode::FAILURE
            };
        }
        _ => {
            return ExitCode::FAILURE;
        }
    }

    //
    /* println!("no-auth exports:");
    let no_auth_component: AccountComponent = NoAuth::new().into();
    let no_auth_exports = no_auth_component.library().exports();
    for export in no_auth_exports {
        println!("procedure name: {} - digest: {}", export.name.name, 0);
    } */
    //

    // let account_component_bytes = fs::read("/Users/saimeunt/miden/counter-contract/counter-contract/target/miden/release/counter_contract.masp").unwrap();
    // let account_component_package = Package::read_from_bytes(&account_component_bytes).unwrap();
    // //
    // let exports = account_component_package.manifest.exports();
    // println!("counter-contract exports:");
    // for export in exports {
    //     println!(
    //         "procedure name: {} - digest: {}",
    //         export.name.name,
    //         export.digest.to_hex()
    //     );
    // }
    // //
    // let init_storage_data = InitStorageData::new(
    //     [(
    //         StorageValueName::new("count").unwrap(),
    //         "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
    //     )],
    //     BTreeMap::new(),
    // );
    // let account_component = AccountComponent::from_package_with_init_data(
    //     &account_component_package,
    //     &init_storage_data,
    // )
    // .unwrap()
    // .with_supported_types(BTreeSet::from_iter([
    //     AccountType::RegularAccountUpdatableCode,
    // ]));

    // let mut init_seed = [0_u8; 32];
    // client.rng().fill_bytes(&mut init_seed);

    // let account = AccountBuilder::new(init_seed)
    //     .account_type(AccountType::RegularAccountUpdatableCode)
    //     .storage_mode(AccountStorageMode::Public)
    //     .with_auth_component(NoAuth)
    //     .with_component(account_component)
    //     .build()
    //     .unwrap();
    // client.add_account(&account, false).await?;

    // let address = Address::new(account.id())
    //     .with_routing_parameters(RoutingParameters::new(AddressInterface::BasicWallet))
    //     .unwrap()
    //     .encode(NetworkId::Testnet);
    // println!("counter address: {}", address);

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

    // Ok(std::process::ExitCode::SUCCESS)
}
