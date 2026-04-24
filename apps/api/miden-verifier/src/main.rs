use anyhow::{Result, anyhow, bail};
use base64::prelude::*;
use miden_client::{
    account::{Account, AccountId, AccountInterfaceExt},
    builder::ClientBuilder,
    keystore::FilesystemKeyStore,
    note::{Note, NoteFile, NoteId, NoteScript},
    rpc::{Endpoint, GrpcClient},
    transaction::{AccountComponentInterface, AccountInterface},
    utils::Deserializable,
    vm::{Package, PackageExport},
};
use miden_client_sqlite_store::ClientBuilderSqliteExt;
// use miden_standards::account::components::{
//     basic_fungible_faucet_library, basic_wallet_library, multisig_library, multisig_psm_library,
//     network_fungible_faucet_library, no_auth_library, singlesig_acl_library, singlesig_library,
// };
// use miden_standards::note::{BurnNote, MintNote, P2idNote, P2ideNote, StandardNote, SwapNote};
use miden_standards::note::StandardNote;
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
            AccountComponentInterface::AuthSingleSig => {
                println!("AuthSingleSig")
            }
            AccountComponentInterface::AuthSingleSigAcl => {
                println!("AuthSingleSigAcl")
            }
            AccountComponentInterface::AuthMultisig => {
                println!("AuthMultisig")
            }
            AccountComponentInterface::AuthMultisigPsm => {
                println!("AuthMultisigPsm")
            }
            AccountComponentInterface::AuthNoAuth => println!("AuthNoAuth"),
            AccountComponentInterface::Custom(_) => {
                if let Some(package) = package_opt.clone() {
                    if package.manifest.num_exports() == 0 {
                        bail!("Package has no exports");
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
                        println!("Custom({})", package.digest());
                    }
                }
            }
        }
    }

    Ok(())
}

fn verify_note_script(note_script: &NoteScript, package_opt: Option<Package>) -> Result<()> {
    if let Some(standard_note) = StandardNote::from_script(note_script) {
        println!("{}", standard_note.name());
    } else if let Some(package) = package_opt.clone() {
        let mut procedures = package
            .manifest
            .exports()
            .filter_map(|export| match export {
                PackageExport::Procedure(procedure) => Some(procedure),
                _ => None,
            });
        let run_procedure_opt =
            procedures.find(|procedure| procedure.path.as_str().ends_with("::run"));
        if let Some(run_procedure) = run_procedure_opt
            && run_procedure.digest == note_script.root()
        {
            println!("Custom({})", package.digest());
        }
    }
    Ok(())
}

// cargo run --release
#[tokio::main]
async fn main() -> Result<()> {
    // println!("standard notes script roots");
    // println!("P2ID: {}", P2idNote::script_root());
    // println!("P2IDE: {}", P2ideNote::script_root());
    // println!("SWAP: {}", SwapNote::script_root());
    // println!("MINT: {}", MintNote::script_root());
    // println!("BURN: {}", BurnNote::script_root());
    // println!("standard account components");
    // let libraries = vec![
    //     basic_wallet_library(),
    //     basic_fungible_faucet_library(),
    //     network_fungible_faucet_library(),
    //     singlesig_library(),
    //     singlesig_acl_library(),
    //     multisig_library(),
    //     multisig_psm_library(),
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
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 6 {
        eprintln!(
            "Usage: {} <network-id> <account-component|note-script|transaction-script> <resource-id> <resource-path> <masp-path>",
            args[0]
        );
        bail!("Wrong number of arguments");
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
                Account::try_from(account_record)
                    .map_err(|e| anyhow!("Account is missing full account data: {}", e))?
            } else {
                let resource = fs::read_to_string(resource_path)?;
                let resource_bytes = BASE64_STANDARD.decode(resource)?;
                Account::read_from_bytes(&resource_bytes)?
            };

            verify_account_component(account, package_opt)
        }
        "note-script" => {
            let note_id = NoteId::try_from_hex(resource_id)?;

            let note_script = if resource_path.as_str() == "/dev/null" {
                match client.import_notes(&[NoteFile::NoteId(note_id)]).await {
                    Ok(_) => {}
                    Err(_) => {
                        return Ok(());
                    }
                };
                let note_record = client.get_input_note(note_id).await?.unwrap();
                note_record.details().script().clone()
            } else {
                let resource = fs::read_to_string(resource_path)?;
                let resource_bytes = BASE64_STANDARD.decode(resource)?;
                let note = Note::read_from_bytes(&resource_bytes)?;
                note.script().clone()
            };

            verify_note_script(&note_script, package_opt)
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
