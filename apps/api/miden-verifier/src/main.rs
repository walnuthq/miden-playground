use anyhow::{Result, anyhow, bail};
use base64::prelude::*;
use miden_client::{
    account::{Account, AccountId, AccountInterfaceExt},
    builder::ClientBuilder,
    keystore::FilesystemKeyStore,
    note::{Note, NoteFile, NoteId, WellKnownNote},
    rpc::{Endpoint, GrpcClient},
    store::AccountRecordData,
    transaction::{AccountComponentInterface, AccountInterface},
    utils::Deserializable,
    vm::{Package, PackageExport},
};
use miden_client_sqlite_store::ClientBuilderSqliteExt;
// use miden_standards::account::components::{
//     basic_fungible_faucet_library, basic_wallet_library, ecdsa_k256_keccak_acl_library,
//     ecdsa_k256_keccak_library, ecdsa_k256_keccak_multisig_library, falcon_512_rpo_acl_library,
//     falcon_512_rpo_library, falcon_512_rpo_multisig_library, network_fungible_faucet_library,
//     no_auth_library,
// };
use std::fs;
use std::sync::Arc;

fn verify_account_component(account: Account, package_opt: Option<Package>) -> Result<()> {
    let account_interface = AccountInterface::from_account(&account);
    for component in account_interface.components() {
        match component {
            AccountComponentInterface::BasicWallet => println!("BasicWallet"),
            AccountComponentInterface::BasicFungibleFaucet => {
                println!("BasicFungibleFaucet")
            }
            AccountComponentInterface::NetworkFungibleFaucet => {
                println!("NetworkFungibleFaucet")
            }
            AccountComponentInterface::AuthEcdsaK256Keccak => {
                println!("AuthEcdsaK256Keccak")
            }
            AccountComponentInterface::AuthEcdsaK256KeccakAcl => {
                println!("AuthEcdsaK256KeccakAcl")
            }
            AccountComponentInterface::AuthEcdsaK256KeccakMultisig => {
                println!("AuthEcdsaK256KeccakMultisig")
            }
            AccountComponentInterface::AuthFalcon512Rpo => println!("AuthFalcon512Rpo"),
            AccountComponentInterface::AuthFalcon512RpoAcl => {
                println!("AuthFalcon512RpoAcl")
            }
            AccountComponentInterface::AuthFalcon512RpoMultisig => {
                println!("AuthFalcon512RpoMultisig")
            }
            AccountComponentInterface::AuthNoAuth => println!("AuthNoAuth"),
            AccountComponentInterface::Custom(_) => {
                if let Some(package) = package_opt.clone() {
                    if package.manifest.num_exports() == 0 {
                        return Err(anyhow!("Package has no exports"));
                    }
                    let mut procedures =
                        package
                            .manifest
                            .exports()
                            .filter_map(|export| match export {
                                PackageExport::Procedure(procedure) => Some(procedure),
                                _ => None,
                            });

                    let verified =
                        procedures.all(|procedure| account.code().has_procedure(procedure.digest));
                    if verified {
                        println!("CustomAccountComponent({})", package.digest());
                    }
                }
            }
        }
    }

    Ok(())
}

fn verify_note_script(note: Note, package_opt: Option<Package>) -> Result<()> {
    if let Some(well_known_note) = WellKnownNote::from_note(&note) {
        let well_known_note_str = match well_known_note {
            WellKnownNote::P2ID => "P2ID",
            WellKnownNote::P2IDE => "P2IDE",
            WellKnownNote::SWAP => "SWAP",
            WellKnownNote::MINT => "MINT",
            WellKnownNote::BURN => "BURN",
        };
        println!("{}", well_known_note_str);
    } else if let Some(package) = package_opt.clone() {
        if package.digest() == note.script().root() {
            println!("CustomNoteScript({})", package.digest());
        }
    }
    Ok(())
}

// cargo run --release
#[tokio::main]
async fn main() -> Result<()> {
    // println!("standard notes");
    // let standard_notes = vec![
    //     WellKnownNote::P2ID,
    //     WellKnownNote::P2IDE,
    //     WellKnownNote::SWAP,
    //     WellKnownNote::MINT,
    //     WellKnownNote::BURN,
    // ];
    // for standard_note in standard_notes {
    //     println!("{}", standard_note.script_root().to_hex());
    // }
    // println!("standard components");
    // let libraries = vec![
    //     basic_wallet_library(),
    //     basic_fungible_faucet_library(),
    //     network_fungible_faucet_library(),
    //     ecdsa_k256_keccak_library(),
    //     ecdsa_k256_keccak_acl_library(),
    //     ecdsa_k256_keccak_multisig_library(),
    //     falcon_512_rpo_library(),
    //     falcon_512_rpo_acl_library(),
    //     falcon_512_rpo_multisig_library(),
    //     no_auth_library(),
    // ];
    // for library in libraries {
    //     println!("{}", library.digest().to_hex());
    //     let exports: Vec<_> = library.exports().collect();
    //     for export in exports {
    //         println!(
    //             "{} {}",
    //             export.path(),
    //             library
    //                 .get_procedure_root_by_path(export.path())
    //                 .unwrap()
    //                 .to_hex()
    //         );
    //     }
    // }
    // println!("{:?}", exports);
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 6 {
        eprintln!(
            "Usage: {} <network-id> <account-component|note-script|transaction-script> <resource-id> <resource-path> <masp-path>",
            args[0]
        );
        return Err(anyhow!("Wrong number of arguments"));
    }
    let network_id = &args[1];
    let resource_type = &args[2];
    let resource_id = &args[3];
    let resource_path = &args[4];
    let masp_path = &args[5];
    // Initialize client
    let endpoint = match network_id.as_str() {
        "mtst" => Endpoint::testnet(),
        "mdev" => Endpoint::devnet(),
        "mlcl" => Endpoint::localhost(),
        _ => Endpoint::testnet(),
    };
    let timeout_ms = 10_000;
    let rpc_client = Arc::new(GrpcClient::new(&endpoint, timeout_ms));

    // Initialize keystore
    let keystore_path = std::path::PathBuf::from("./keystore");
    let keystore = Arc::new(FilesystemKeyStore::new(keystore_path)?);

    let store_path = std::path::PathBuf::from("./store.sqlite3");

    let mut client = ClientBuilder::new()
        .rpc(rpc_client)
        .sqlite_store(store_path)
        .authenticator(keystore.clone())
        .in_debug_mode(true.into())
        .build()
        .await?;

    let package_opt = if masp_path.as_str() == "/dev/null" {
        None
    } else {
        let package_bytes = fs::read(masp_path)?;
        Some(Package::read_from_bytes(&package_bytes)?)
    };

    match resource_type.as_str() {
        "account-component" => {
            let account_id = if resource_id.starts_with("0x") {
                AccountId::from_hex(resource_id)?
            } else {
                let (_, decoded_account_id) = AccountId::from_bech32(resource_id)?;
                decoded_account_id
            };

            let account = if resource_path.as_str() == "/dev/null" {
                match client.import_account_by_id(account_id).await {
                    Ok(()) => {}
                    Err(_) => {
                        return Ok(());
                    }
                };
                let account_record = client.get_account(account_id).await?.unwrap();
                let account = match account_record.account_data() {
                    AccountRecordData::Full(account) => account,
                    AccountRecordData::Partial(_) => bail!("Account is missing full account data"),
                };
                account.clone()
            } else {
                let resource = fs::read_to_string(resource_path)?;
                let resource_bytes = BASE64_STANDARD.decode(resource)?;
                Account::read_from_bytes(&resource_bytes)?
            };

            verify_account_component(account, package_opt)
        }
        "note-script" => {
            let note_id = NoteId::try_from_hex(resource_id)?;

            let note = if resource_path.as_str() == "/dev/null" {
                match client.import_notes(&[NoteFile::NoteId(note_id)]).await {
                    Ok(_) => {}
                    Err(_) => {
                        return Ok(());
                    }
                };
                let note_record = client.get_input_note(note_id).await?.unwrap();
                note_record.try_into().unwrap()
            } else {
                let resource = fs::read_to_string(resource_path)?;
                let resource_bytes = BASE64_STANDARD.decode(resource)?;
                Note::read_from_bytes(&resource_bytes)?
            };

            verify_note_script(note, package_opt)
        }
        "transaction-script" => {
            // TODO unimplemented
            // let tx_ix = TransactionId::from_raw(Word::try_from(resource_id)?);
            Ok(())
        }
        _ => Err(anyhow!(
            "Resource type should be one of account-component|note-script|transaction-script"
        )),
    }
}
