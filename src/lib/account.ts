import { generateAccountId } from '@/lib/miden-wasm-api';
import { generateId } from '@/lib/utils';
import { SECRET_KEY } from '@/lib/consts/secret-key';
import { DEFAULT_FAUCET_IDS } from '@/lib/consts/defaults';
import { Asset } from '@/lib/types';
import { EditorFiles } from '@/lib/files';

interface AccountProps {
	id: bigint;
	name: string;
	isWallet: boolean;
	isAuth: boolean;
	assets: Asset[];
	secretKey: Uint8Array;
	scriptFileId: string;
	metadataFileId: string;
	vaultFileId: string;
}

export class Account {
	id: bigint;
	name: string;
	isWallet: boolean;
	isAuth: boolean;
	assets: Asset[];
	secretKey: Uint8Array;
	scriptFileId: string;
	metadataFileId: string;
	vaultFileId: string;

	constructor(props: AccountProps) {
		this.id = props.id;
		this.name = props.name;
		this.isWallet = props.isWallet;
		this.isAuth = props.isAuth;
		this.assets = props.assets;
		this.secretKey = props.secretKey;
		this.scriptFileId = props.scriptFileId;
		this.metadataFileId = props.metadataFileId;
		this.vaultFileId = props.vaultFileId;
	}

	static new(name: string): { account: Account; newFiles: EditorFiles } {
		const id = generateAccountId();
		const idHex = '0x' + id.toString(16);
		const scriptFileId = generateId();
		const metadataFileId = generateId();
		const vaultFileId = generateId();
		const newFiles: EditorFiles = {
			[scriptFileId]: {
				id: scriptFileId,
				name: 'Custom script',
				content: { value: ACCOUNT_SCRIPT },
				isOpen: false,
				readonly: false,
				variant: 'script'
			},
			[metadataFileId]: {
				id: metadataFileId,
				name: 'Metadata',
				isOpen: false,
				readonly: true,
				variant: 'file',
				content: {
					dynamic: {
						account: {
							accountId: idHex,
							variant: 'metadata'
						}
					}
				}
			},
			[vaultFileId]: {
				id: vaultFileId,
				name: 'Vault',
				content: {
					dynamic: {
						account: {
							accountId: idHex,
							variant: 'vault'
						}
					}
				},
				isOpen: false,
				readonly: true,
				variant: 'file'
			}
		};
		const account = new Account({
			id: id,
			name,
			isWallet: true,
			isAuth: true,
			assets: [
				{
					faucetId: DEFAULT_FAUCET_IDS[0],
					faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
					amount: 500n
				},
				{
					faucetId: DEFAULT_FAUCET_IDS[1],
					faucetIdHex: DEFAULT_FAUCET_IDS[1].toString(16),
					amount: 500n
				}
			],
			secretKey: SECRET_KEY,
			scriptFileId,
			metadataFileId,
			vaultFileId
		});

		return { account, newFiles };
	}

	get idHex() {
		return '0x' + this.id.toString(16);
	}
}

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
