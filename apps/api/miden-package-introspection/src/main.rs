use miden_mast_package::Package;
use serde_json::Result;
use std::fs;
use winter_utils::Deserializable;

// cargo run --release --bin miden_package_introspection
fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 2 {
        eprintln!("Usage: {} <path-to-masp-file>", args[0]);
        std::process::exit(1);
    }

    let masp_path = &args[1];
    let bytes = fs::read(masp_path).unwrap();
    let package = Package::read_from_bytes(&bytes).unwrap();

    let json = serde_json::to_string(&package.manifest)?;

    println!("{}", json);

    Ok(())
}
