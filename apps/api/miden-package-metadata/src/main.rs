use anyhow::{Context, Result};
use clap::Parser;
use miden_mast_package::{Package, PackageManifest};
use miden_serde_utils::Deserializable;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Extracts and prints metadata from a Miden package (.masp) file as JSON.
#[derive(Parser)]
#[command(version, about)]
struct Args {
    /// Path to the .masp file
    masp_path: PathBuf,
}

#[derive(Serialize, Deserialize)]
struct PackageMetadata {
    digest: String,
    manifest: PackageManifest,
}

fn main() -> Result<()> {
    let args = Args::parse();

    let bytes = std::fs::read(&args.masp_path)
        .with_context(|| format!("failed to read '{}'", args.masp_path.display()))?;

    let package = Package::read_from_bytes(&bytes).with_context(|| {
        format!(
            "failed to parse package from '{}'",
            args.masp_path.display()
        )
    })?;

    let metadata = PackageMetadata {
        digest: package.mast.digest().to_hex(),
        manifest: package.manifest,
    };

    println!("{}", serde_json::to_string(&metadata)?);

    Ok(())
}
