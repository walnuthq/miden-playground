export const ACCOUNT_SCRIPT = `use.miden::account
use.std::sys

export.custom
    push.1 drop
end

export.custom_set_item
    exec.account::set_item
    exec.sys::truncate_stack
end`;

export const ACCOUNT_AUTH_SCRIPT = `export.::miden::contracts::auth::basic::auth_tx_rpo_falcon512`;

export const ACCOUNT_WALLET_SCRIPT = `export.::miden::contracts::wallets::basic::receive_asset
export.::miden::contracts::wallets::basic::create_note
export.::miden::contracts::wallets::basic::move_asset_to_note`;
