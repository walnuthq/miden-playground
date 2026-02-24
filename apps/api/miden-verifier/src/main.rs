use anyhow::{Result, anyhow, bail};
use base64::prelude::*;
use miden_client::{
    account::{Account, AccountId},
    builder::ClientBuilder,
    keystore::FilesystemKeyStore,
    note::{NoteFile, NoteId},
    rpc::{Endpoint, GrpcClient},
    store::AccountRecordData,
    utils::Deserializable,
    vm::{Package, PackageExport},
};
use miden_client_sqlite_store::ClientBuilderSqliteExt;
use std::fs;
use std::sync::Arc;

// cargo run --release
#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 5 {
        eprintln!(
            "Usage: {} <account-component|note|transaction> <resource-id> <resource-path> <masp-path>",
            args[0]
        );
        return Err(anyhow!("Wrong number of arguments"));
    }
    // Initialize client
    let endpoint = Endpoint::testnet();
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

    let resource_type = &args[1];
    let resource_id = &args[2];
    let resource_path = &args[3];
    let masp_path = &args[4];

    let package_bytes = fs::read(masp_path)?;
    let package = Package::read_from_bytes(&package_bytes)?;

    match resource_type.as_str() {
        "account-component" => {
            let account_id = AccountId::from_hex(resource_id)?;
            // println!("account_id: {}", account_id);

            let account = if resource_path.as_str() == "/dev/null" {
                client.import_account_by_id(account_id).await?;
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

            // println!("manifest.num_exports(): {}", package.manifest.num_exports());
            if package.manifest.num_exports() == 0 {
                return Err(anyhow!("Package has no exports"));
            }

            let exports = package.manifest.exports();
            let mut procedures = exports.filter_map(|export| match export {
                PackageExport::Procedure(procedure) => Some(procedure),
                _ => None,
            });
            let verified =
                procedures.all(|procedure| account.code().has_procedure(procedure.digest));

            // println!("verified: {}", verified);
            return if verified {
                Ok(())
            } else {
                Err(anyhow!("Account Component couldn't be verified"))
            };
        }
        "note" => {
            let note_id = NoteId::try_from_hex(resource_id)?;
            client.import_notes(&[NoteFile::NoteId(note_id)]).await?;
            let note_record = client.get_input_note(note_id).await?.unwrap();

            let verified = package.digest() == note_record.details().script().root();

            return if verified {
                Ok(())
            } else {
                Err(anyhow!("Note couldn't be verified"))
            };
        }
        "transaction" => {
            let verified = false;

            return if verified {
                Ok(())
            } else {
                Err(anyhow!("Transaction couldn't be verified"))
            };
        }
        _ => {
            return Err(anyhow!(
                "Resource type should be one of account-component|note|transaction"
            ));
        }
    }
}
