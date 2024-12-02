#![allow(dead_code)]
use alloc::{boxed::Box, format, vec, vec::Vec};
use core::fmt::Display;

use miden_crypto::merkle::MerkleError;
use miden_objects::{
    accounts::{
        account_id::account_id_from_felt, Account, AccountCode, AccountComponent, AccountId,
        AccountStorage, AccountStorageMode, AccountType,
    },
    assets::{Asset, AssetVault},
    AccountError, AssetVaultError, Digest, Felt, Word, ZERO,
};

// CONSTANTS
// ================================================================================================
pub const DEFAULT_ACCOUNT_CODE: &str = "
    export.::miden::contracts::wallets::basic::receive_asset
    export.::miden::contracts::wallets::basic::create_note
    export.::miden::contracts::wallets::basic::move_asset_to_note
    export.::miden::contracts::auth::basic::auth_tx_rpo_falcon512
";

// ACCOUNT BUILDER
// ================================================================================================
/// Builder for an `Account`, the builder allows for a fluent API to construct an account. Each
/// account needs a unique builder.
#[derive(Debug, Clone)]
pub struct AccountBuilder {
    nonce: Felt,
    assets: Vec<Asset>,
    components: Vec<AccountComponent>,
    account_type: AccountType,
    storage_mode: AccountStorageMode,
    init_seed: Option<[u8; 32]>,
}

impl AccountBuilder {
    /// Creates a new builder for a single account.
    pub fn new() -> Self {
        Self {
            nonce: ZERO,
            assets: vec![],
            components: vec![],
            init_seed: None,
            account_type: AccountType::RegularAccountUpdatableCode,
            storage_mode: AccountStorageMode::Private,
        }
    }

    /// Sets the initial seed from which the grind for an [`AccountId`] will start. This initial
    /// seed should come from a cryptographic random number generator.
    ///
    ///  This method **must** be called.
    pub fn init_seed(mut self, init_seed: [u8; 32]) -> Self {
        self.init_seed = Some(init_seed);
        self
    }

    /// Sets the type of the account.
    pub fn account_type(mut self, account_type: AccountType) -> Self {
        self.account_type = account_type;
        self
    }

    /// Sets the storage mode of the account.
    pub fn storage_mode(mut self, storage_mode: AccountStorageMode) -> Self {
        self.storage_mode = storage_mode;
        self
    }

    /// Adds an [`AccountComponent`] to the builder. This method can be called multiple times and
    /// **must be called at least once** since an account must export at least one procedure.
    ///
    /// All components will be merged to form the final code and storage of the built account.
    pub fn with_component(mut self, account_component: impl Into<AccountComponent>) -> Self {
        self.components.push(account_component.into());
        self
    }

    /// Builds the common parts of testing and non-testing code.
    fn build_inner(
        &self,
    ) -> Result<([u8; 32], AssetVault, AccountCode, AccountStorage), AccountError> {
        let init_seed = self.init_seed.ok_or(AccountError::BuildError(
            "init_seed must be set on the account builder".into(),
            None,
        ))?;

        let vault = AssetVault::new(&self.assets).map_err(|err| {
            AccountError::BuildError(format!("asset vault failed to build: {err}"), None)
        })?;

        if self.nonce == ZERO && !vault.is_empty() {
            return Err(AccountError::BuildError(
                "account asset vault must be empty on new accounts".into(),
                None,
            ));
        }

        let (code, storage) =
            Account::initialize_from_components(self.account_type, &self.components).map_err(
                |err| {
                    AccountError::BuildError(
                        "account components failed to build".into(),
                        Some(Box::new(err)),
                    )
                },
            )?;

        Ok((init_seed, vault, code, storage))
    }

    /// Grinds a new [`AccountId`] using the `init_seed` as a starting point.
    fn grind_account_id(
        &self,
        init_seed: [u8; 32],
        code_commitment: Digest,
        storage_commitment: Digest,
    ) -> Result<(AccountId, Word), AccountError> {
        let seed = AccountId::get_account_seed(
            init_seed,
            self.account_type,
            self.storage_mode,
            code_commitment,
            storage_commitment,
        )
        .map_err(|err| {
            AccountError::BuildError("account seed generation failed".into(), Some(Box::new(err)))
        })?;

        let account_id = AccountId::new(seed, code_commitment, storage_commitment)
            .expect("get_account_seed should provide a suitable seed");

        Ok((account_id, seed))
    }
    /// Builds an [`Account`] out of the configured builder.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The init seed is not set.
    /// - Any of the components does not support the set account type.
    /// - The number of procedures in all merged components is 0 or exceeds
    ///   [`AccountCode::MAX_NUM_PROCEDURES`](crate::accounts::AccountCode::MAX_NUM_PROCEDURES).
    /// - Two or more libraries export a procedure with the same MAST root.
    /// - The number of [`StorageSlot`](crate::accounts::StorageSlot)s of all components exceeds
    ///   255.
    /// - [`MastForest::merge`](vm_processor::MastForest::merge) fails on the given components.
    /// - If duplicate assets were added to the builder (only under the `testing` feature).
    /// - If the vault is not empty on new accounts (only under the `testing` feature).
    pub fn build(self) -> Result<(Account, Word), AccountError> {
        let (init_seed, vault, code, storage) = self.build_inner()?;

        let (account_id, seed) =
            self.grind_account_id(init_seed, code.commitment(), storage.commitment())?;

        debug_assert_eq!(account_id.account_type(), self.account_type);
        debug_assert_eq!(account_id.storage_mode(), self.storage_mode);

        let account = Account::from_parts(account_id, vault, storage, code, self.nonce);

        Ok((account, seed))
    }
    /// Sets the nonce of the account. This method is optional.
    ///
    /// If unset, the nonce will default to [`ZERO`].
    pub fn nonce(mut self, nonce: Felt) -> Self {
        self.nonce = nonce;
        self
    }

    /// Adds all the assets to the account's [`AssetVault`]. This method is optional.
    ///
    /// Must only be called when nonce is non-[`ZERO`] since new accounts must have an empty vault.
    pub fn with_assets<I: IntoIterator<Item = Asset>>(mut self, assets: I) -> Self {
        self.assets.extend(assets);
        self
    }

    /// The build method optimized for testing scenarios. The only difference between this method
    /// and the [`Self::build`] method is that when building existing accounts, this function
    /// returns `None` for the seed, skips the grinding of an account id and constructs one
    /// instead. Hence it is always preferable to use this method in testing code.
    ///
    /// For possible errors, see the documentation of [`Self::build`].
    pub fn build_testing(self) -> Result<(Account, Option<Word>), AccountError> {
        let (init_seed, vault, code, storage) = self.build_inner()?;

        let (account_id, seed) = if self.nonce == ZERO {
            let (account_id, seed) =
                self.grind_account_id(init_seed, code.commitment(), storage.commitment())?;

            (account_id, Some(seed))
        } else {
            let bytes = <[u8; 8]>::try_from(&init_seed[0..8])
                .expect("we should have sliced exactly 8 bytes off");

            let account_id =
                AccountId::new_with_type_and_mode(bytes, self.account_type, self.storage_mode);

            (account_id, None)
        };

        let account = Account::from_parts(account_id, vault, storage, code, self.nonce);

        Ok((account, seed))
    }
}

#[derive(Debug)]
pub enum AccountBuilderError {
    AccountError(AccountError),
    AssetVaultError(AssetVaultError),
    MerkleError(MerkleError),

    /// When the created [AccountId] doesn't match the builder's configured [AccountType].
    SeedAndAccountTypeMismatch,

    /// When the created [AccountId] doesn't match the builder's `on_chain` config.
    SeedAndOnChainMismatch,
}

impl Display for AccountBuilderError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(f, "{:?}", self)
    }
}

// Define a trait to add the new method.
pub trait AccountIdExt {
    fn new_with_type_and_mode(
        bytes: [u8; 8],
        account_type: AccountType,
        storage_mode: AccountStorageMode,
    ) -> AccountId;
}

// Implement the trait for AccountId.
impl AccountIdExt for AccountId {
    fn new_with_type_and_mode(
        mut bytes: [u8; 8],
        account_type: AccountType,
        storage_mode: AccountStorageMode,
    ) -> AccountId {
        let id_high_nibble = (storage_mode as u8) << 6 | (account_type as u8) << 4;

        // Clear the highest five bits of the most significant byte.
        bytes[0] &= 0x07;
        // Set high nibble of the most significant byte.
        bytes[0] |= id_high_nibble;
        // Set the lowest 5 bits to ensure we have at least MIN_ACCOUNT_ONES.
        bytes[7] |= 0x1f;

        // Convert bytes to a `Felt` and then to `AccountId`.
        let account_id = account_id_from_felt(
            Felt::try_from(u64::from_be_bytes(bytes))
                .expect("must be a valid Felt after clearing the 5th highest bit"),
        )
        .expect("account id should satisfy criteria of a valid ID");

        // Ensure the account type and storage mode match expectations.
        debug_assert_eq!(account_id.account_type(), account_type);
        debug_assert_eq!(account_id.storage_mode(), storage_mode);

        account_id
    }
}
