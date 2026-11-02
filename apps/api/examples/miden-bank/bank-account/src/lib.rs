// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]
#![feature(alloc_error_handler)]

#[macro_use]
extern crate alloc;

use miden::*;

use miden::Felt;

/// Maximum allowed deposit amount per transaction.
///
/// This limit provides a safety constraint for the banking system.
///
/// Value: 1,000,000 tokens (arbitrary limit for demonstration)
///
/// # Implementation Notes
/// In Miden Rust contracts, constants are defined using standard Rust `const` syntax.
/// The value is a u64 which can be compared against a Felt's underlying representation
/// using the `as_canonical_u64()` method.
///
/// # Error Handling
/// When this limit is exceeded, the contract uses `assert!()` to fail the transaction.
/// In the Miden VM, a failed assertion means the proof cannot be generated,
/// effectively rejecting the transaction at the proving stage.
const MAX_DEPOSIT_AMOUNT: u64 = 1_000_000;

/// Maximum allowed balance per depositor per asset.
///
/// This matches `FungibleAsset::MAX_AMOUNT` (2^63 - 2^31) from the Miden protocol.
/// Felt arithmetic is modular (wraps at the Goldilocks prime), so without this guard
/// a cumulative balance could silently wrap around to zero. Validating the u64 result
/// of the addition against this bound prevents that overflow.
const MAX_BALANCE: u64 = 9_223_372_034_707_292_160; // 2^63 - 2^31

/// Storage layout for the bank account component.
///
/// Users deposit assets via deposit notes, and the bank tracks
/// each depositor's balance in a storage map keyed by their AccountId.
///
/// The bank must be initialized before deposits are accepted. This is done
/// via a transaction script that calls the `initialize()` method.
#[component_storage]
struct BankStorage {
    /// Tracks whether the bank has been initialized (deposits enabled).
    /// Word layout: [is_initialized (0 or 1), 0, 0, 0]
    /// Must be set to 1 via `initialize()` before deposits are accepted.
    #[storage(description = "initialized")]
    initialized: StorageValue<Word>,

    /// Maps (depositor AccountId, faucet ID) -> balance (as Felt).
    /// Key is derived as: [depositor.prefix, depositor.suffix, faucet_prefix (asset.id.inner[3]), faucet_suffix (asset.id.inner[2])],
    /// which isolates balances per depositor per asset type.
    ///
    /// Note (v0.17): the asset's metadata byte (version and composition) is folded into
    /// the low 8 bits of the faucet-suffix limb (`asset.id.inner[2]`). The callback flag
    /// is part of the faucet ID. Thus the encoded faucet-suffix limb is
    /// NOT the raw faucet suffix. For the callbacks-disabled fungible assets this bank
    /// accepts the metadata byte is constant, so the derived key is still a stable
    /// per-depositor-per-faucet identifier.
    #[storage(description = "balances")]
    balances: StorageMap<Word, Felt>,
}

/// API of the bank account component.
#[component]
trait Bank {
    /// Initialize the bank account, enabling deposits.
    ///
    /// This function should be called via a transaction script by the account owner.
    /// Once initialized, the bank can accept deposits. This also serves to "deploy"
    /// the account on-chain (accounts are only visible after their first state change).
    ///
    /// # Panics
    /// Panics if the bank is already initialized.
    #[account_procedure]
    fn initialize(&mut self);

    /// Get the bank-tracked balance for a depositor and specific asset type.
    ///
    /// Named `get_depositor_balance` (not `get_balance`) to avoid colliding with
    /// the built-in `ActiveAccount::get_balance` vault method that the account
    /// wrapper generates.
    ///
    /// # Arguments
    /// * `depositor` - The AccountId to query the balance for
    /// * `asset` - The asset type to query (used to derive the faucet portion of the key)
    ///
    /// # Returns
    /// The depositor's current balance as a Felt for the given asset type
    #[account_procedure]
    fn get_depositor_balance(&self, depositor: AccountId, asset: Asset) -> Felt;

    /// Deposit an asset into the bank for a specific depositor.
    ///
    /// The asset is added to the bank's vault and the depositor's
    /// balance is updated in the mapping.
    ///
    /// # Arguments
    /// * `depositor` - The AccountId of the user making the deposit
    /// * `deposit_asset` - The fungible asset being deposited
    ///
    /// # Panics
    /// Panics if the asset is non-fungible.
    /// Panics if the deposit amount exceeds `MAX_DEPOSIT_AMOUNT`.
    /// Panics if the resulting balance would exceed `MAX_BALANCE` (u64 overflow).
    /// Panics if the bank has not been initialized.
    #[account_procedure]
    fn deposit(&mut self, depositor: AccountId, deposit_asset: Asset);

    /// Withdraw assets back to the depositor.
    ///
    /// Creates a P2ID note that sends the requested asset to the depositor's account.
    /// The depositor is identified via `active_note::get_sender()`, which is
    /// cryptographically bound to the consumed note's metadata — this prevents an
    /// attacker from passing a victim's account ID to drain their balance.
    ///
    /// # Arguments
    /// * `withdraw_asset` - The fungible asset to withdraw
    /// * `serial_num` - Unique serial number for the P2ID output note
    /// * `tag` - The note tag for the P2ID output note (allows caller to specify routing)
    /// * `note_type` - Note type: 1 = Public (stored on-chain), 0 = Private (off-chain)
    ///
    /// The P2ID script root is read from the active note's storage (items 10-13).
    ///
    /// # Panics
    /// Panics if the asset is non-fungible.
    /// Panics if the withdrawal amount exceeds the depositor's current balance.
    /// Panics if the bank has not been initialized.
    #[account_procedure]
    fn withdraw(&mut self, withdraw_asset: Asset, serial_num: Word, tag: Felt, note_type: Felt);
}

#[component]
impl Bank for BankStorage {
    fn initialize(&mut self) {
        // Check not already initialized
        let current: Word = self.initialized.get();
        assert!(
            current[0].as_canonical_u64() == 0,
            "Bank already initialized"
        );

        // Set initialized flag to 1
        let initialized_word = Word::from([felt!(1), felt!(0), felt!(0), felt!(0)]);
        self.initialized.set(initialized_word);
    }

    fn get_depositor_balance(&self, depositor: AccountId, asset: Asset) -> Felt {
        // Create key from depositor's AccountId and asset faucet ID
        let key = Word::from([
            depositor.prefix,
            depositor.suffix,
            asset.id.inner[3], // faucet_prefix
            asset.id.inner[2], // faucet_suffix (+ metadata byte; see `balances` field docs)
        ]);
        self.balances.get(key)
    }

    fn deposit(&mut self, depositor: AccountId, deposit_asset: Asset) {
        // Ensure the bank is initialized before accepting deposits
        self.require_initialized();

        // Check the asset composition; zero padding alone cannot distinguish NFTs.
        assert!(
            deposit_asset.is_fungible(),
            "Only fungible assets are supported"
        );

        // Extract the fungible amount from the asset value word
        // Asset value layout for fungible: [amount, 0, 0, 0]
        let deposit_amount = deposit_asset.value[0];

        // Validate deposit amount does not exceed maximum
        assert!(
            deposit_amount.as_canonical_u64() <= MAX_DEPOSIT_AMOUNT,
            "Deposit amount exceeds maximum allowed"
        );

        // Create key from depositor's AccountId and asset faucet ID.
        // This allows tracking balances per depositor per asset type.
        let key = Word::from([
            depositor.prefix,
            depositor.suffix,
            deposit_asset.id.inner[3], // faucet_prefix
            deposit_asset.id.inner[2], // faucet_suffix (+ metadata byte; see `balances` field docs)
        ]);

        // Update balance in integer space to avoid modular Felt wraparound.
        // Felt arithmetic is modular (wraps at the Goldilocks prime), so we
        // validate entirely in u64 before storing the result as a Felt.
        let current_balance: Felt = self.balances.get(key);
        let current_u64 = current_balance.as_canonical_u64();
        let deposit_u64 = deposit_amount.as_canonical_u64();

        let new_balance_u64 = current_u64
            .checked_add(deposit_u64)
            .expect("Balance overflow: addition exceeds u64 range");
        assert!(
            new_balance_u64 <= MAX_BALANCE,
            "Balance would exceed maximum allowed"
        );

        self.balances.set(key, Felt::new(new_balance_u64).unwrap());

        // Add asset to the bank's vault
        native_account::add_asset(deposit_asset);
    }

    fn withdraw(&mut self, withdraw_asset: Asset, serial_num: Word, tag: Felt, note_type: Felt) {
        // Ensure the bank is initialized before processing withdrawals
        self.require_initialized();

        // Identify the depositor from the note's sender — this is cryptographically
        // bound to the note metadata, so it cannot be spoofed by a malicious caller.
        let depositor = active_note::get_sender();

        // Verify this is a fungible asset — see `deposit()` for the rationale.
        assert!(
            withdraw_asset.is_fungible(),
            "Only fungible assets are supported"
        );

        // Extract the fungible amount from the asset value word
        let withdraw_amount = withdraw_asset.value[0];

        // Create key from depositor's AccountId and asset faucet ID
        let key = Word::from([
            depositor.prefix,
            depositor.suffix,
            withdraw_asset.id.inner[3], // faucet_prefix
            withdraw_asset.id.inner[2], // faucet_suffix (+ metadata byte; see `balances` field docs)
        ]);

        // Get current balance and validate sufficient funds exist.
        // This check is critical: Felt arithmetic is modular, so subtracting
        // more than the balance would silently wrap to a large positive number.
        let current_balance: Felt = self.balances.get(key);
        assert!(
            current_balance.as_canonical_u64() >= withdraw_amount.as_canonical_u64(),
            "Withdrawal amount exceeds available balance"
        );

        // Update balance: current - withdraw_amount
        let new_balance = current_balance - withdraw_amount;
        self.balances.set(key, new_balance);

        // Read the P2ID script root from the withdraw-request note's storage (items 10-13).
        // This avoids hardcoding a version-specific MAST root constant and keeps the
        // withdraw function parameter count within the WIT flat-params limit (<= 16).
        let storage = active_note::get_storage();
        let script_root = Word::from([storage[10], storage[11], storage[12], storage[13]]);

        // Create a P2ID note to send the requested asset back to the depositor
        self.create_p2id_note(
            serial_num,
            &withdraw_asset,
            depositor,
            tag,
            note_type,
            script_root,
        );
    }
}

/// Internal helpers that are not part of the component's exported WIT API.
///
/// The `#[component]` macro exports only the methods of the `Bank` trait, so these
/// inherent methods stay private to the contract.
impl BankStorage {
    /// Check that the bank is initialized.
    ///
    /// This internal function is called at the start of operations that require
    /// the bank to be initialized (e.g., deposits).
    ///
    /// # Panics
    /// Panics if the bank has not been initialized.
    fn require_initialized(&self) {
        let current: Word = self.initialized.get();
        assert!(
            current[0].as_canonical_u64() == 1,
            "Bank not initialized - deposits not enabled"
        );
    }

    /// Create a P2ID (Pay-to-ID) note to send assets to a recipient.
    ///
    /// # Arguments
    /// * `serial_num` - Unique serial number for the note
    /// * `asset` - The asset to include in the note
    /// * `recipient_id` - The AccountId that can consume this note
    /// * `tag` - The note tag (passed by caller to allow proper P2ID routing)
    /// * `note_type` - Note type as Felt: 1 = Public, 0 = Private
    /// * `script_root` - The P2ID note script MAST root (Poseidon2-hashed)
    fn create_p2id_note(
        &mut self,
        serial_num: Word,
        asset: &Asset,
        recipient_id: AccountId,
        tag: Felt,
        note_type: Felt,
        script_root: Word,
    ) {
        // Convert the passed tag Felt to a Tag
        // The caller is responsible for computing the proper P2ID tag
        // (typically with_account_target for the recipient)
        let tag = Tag::from(tag);

        // Convert note_type Felt to NoteType
        // 1 = Public (stored on-chain), 0 = Private (off-chain)
        let note_type = NoteType::from(note_type);

        // Compute the recipient hash from:
        // - serial_num: unique identifier for this note instance
        // - script_root: the P2ID note script's MAST root
        // - the target account ID and zero salt [suffix, prefix, 0, 0]
        //
        // This matches the standard P2ID recipient format used by miden-standards.
        let recipient = note::build_recipient(
            serial_num,
            script_root,
            vec![
                recipient_id.suffix,
                recipient_id.prefix,
                felt!(0), // salt_0
                felt!(0), // salt_1
            ],
        );

        // Create the output note
        let note_idx = output_note::create(tag, note_type, recipient);

        // Remove the asset from the bank's vault
        native_account::remove_asset(*asset);

        // Add the asset to the output note
        output_note::add_asset(*asset, note_idx);
    }
}
