import { generateAccountId } from '@/lib/miden-wasm-api';
import { generateId } from '@/lib/utils';
import { SECRET_KEY } from '@/lib/consts/secret-key';
import { DEFAULT_FAUCET_IDS } from '@/lib/consts/defaults';
import { AccountId, Asset, ExecutionOutput } from '@/lib/types';
import _ from 'lodash';
import { EditorFiles } from './files';

interface AccountProps {
	id: AccountId;
	name: string;
	isWallet: boolean;
	isAuth: boolean;
	assets: Asset[];
	secretKey: Uint8Array;
	scriptFileId: string;
	metadataFileId: string;
	vaultFileId: string;
	storageFileId: string;
	codeFileId: string;
}

export class Account {
	id: AccountId;
	name: string;
	isWallet: boolean;
	isAuth: boolean;
	assets: Asset[];
	secretKey: Uint8Array;
	scriptFileId: string;
	metadataFileId: string;
	vaultFileId: string;
	storageFileId: string;
	codeFileId: string;

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
		this.storageFileId = props.storageFileId;
		this.codeFileId = props.codeFileId;
	}

	clone() {
		return new Account(_.cloneDeep(this));
	}

	static new(name: string): { account: Account; newFiles: EditorFiles } {
		const accountId = generateAccountId();
		const scriptFileId = generateId();
		const metadataFileId = generateId();
		const vaultFileId = generateId();
		const storageFileId = generateId();
		const codeFileId = generateId();
		const newFiles: EditorFiles = {
			[scriptFileId]: {
				id: scriptFileId,
				name: 'Code',
				content: { value: ACCOUNT_SCRIPT, variant: 'account-code', accountId: accountId.id },
				isOpen: false,
				readonly: false,
				variant: 'script'
			},
			[metadataFileId]: {
				id: metadataFileId,
				name: 'Info',
				isOpen: false,
				readonly: true,
				variant: 'file',
				content: {
					dynamic: {
						account: {
							accountId: accountId.id,
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
							accountId: accountId.id,
							variant: 'vault'
						}
					}
				},
				isOpen: false,
				readonly: true,
				variant: 'file'
			},
			[storageFileId]: {
				id: storageFileId,
				name: 'Storage',
				content: {
					value: Account.stringifyStorage(Account.initialStorage()),
					accountId: accountId.id
				},
				isOpen: false,
				readonly: false,
				variant: 'file'
			}
		};
		const account = new Account({
			id: accountId,
			name,
			isWallet: true,
			isAuth: true,
			assets: [
				{
					faucetId: DEFAULT_FAUCET_IDS[0],
					amount: 500n
				},
				{
					faucetId: DEFAULT_FAUCET_IDS[1],
					amount: 500n
				}
			],
			secretKey: SECRET_KEY,
			scriptFileId,
			metadataFileId,
			vaultFileId,
			storageFileId,
			codeFileId
		});

		return { account, newFiles };
	}

	static getNextAccountName(accounts: Record<string, Account>) {
		const accountNames = Object.values(accounts).map((account) => account.name);
		let nextAccountName = '';
		let i = 0;
		while (true) {
			nextAccountName = `Account ${String.fromCharCode(65 + i)}`;
			if (!accountNames.includes(nextAccountName)) {
				break;
			}
			i++;
		}
		return nextAccountName;
	}

	disableWalletComponent() {
		this.isWallet = false;
	}

	disableAuthComponent() {
		this.isAuth = false;
	}

	enableWalletComponent() {
		this.isWallet = true;
	}

	enableAuthComponent() {
		this.isAuth = true;
	}

	updateAssetAmount(faucetId: string, updateFn: (amount: bigint) => bigint) {
		const asset = this.assets.find((asset) => asset.faucetId === faucetId);
		if (asset) {
			asset.amount = updateFn(asset.amount);
		}
	}

	static initialStorage() {
		const storage = Array(3).fill(new BigUint64Array([0n, 0n, 0n, 0n]));
		storage[2] = new BigUint64Array([
			13642120692355817730n,
			14340237824901842161n,
			3638127317171027907n,
			15110848026471267870n
		]); // pub key
		return storage;
	}

	static parseStorage(storage: string): BigUint64Array[] {
		return JSON.parse(storage).map((row: string[]) => new BigUint64Array(row.map(BigInt)));
	}

	static stringifyStorage(storage: BigUint64Array[]): string {
		return JSON.stringify(
			storage.map((row) => Array.from(row).map((item) => item.toString())),
			null,
			2
		);
	}

	static computeStorageDiffs(
		oldStorage: BigUint64Array[],
		newStorage: BigUint64Array[]
	): ExecutionOutput['storageDiffs'] {
		const diffs: ExecutionOutput['storageDiffs'] = {};
		for (let i = 0; i < newStorage.length; i++) {
			if (
				!oldStorage[i] ||
				oldStorage[i][0] !== newStorage[i][0] ||
				oldStorage[i][1] !== newStorage[i][1] ||
				oldStorage[i][2] !== newStorage[i][2] ||
				oldStorage[i][3] !== newStorage[i][3]
			) {
				diffs[i] = { old: oldStorage[i], new: newStorage[i] };
			}
		}
		return diffs;
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

export const ACCOUNT_AUTH_SCRIPT = `# The MASM code of the RPO Falcon 512 authentication Account Component.
#
# See the \`RpoFalcon512\` Rust type's documentation for more details.

export.::miden::contracts::auth::basic::auth_tx_rpo_falcon512`;

export const ACCOUNT_WALLET_SCRIPT = `# The MASM code of the Basic Wallet Account Component.
#
# See the \`BasicWallet\` Rust type's documentation for more details.

export.::miden::contracts::wallets::basic::receive_asset
export.::miden::contracts::wallets::basic::create_note
export.::miden::contracts::wallets::basic::move_asset_to_note
`;
