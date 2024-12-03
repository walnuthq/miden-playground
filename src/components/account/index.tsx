import { AccountScript } from './script'
import { AccountState } from './state'

export function Account() {
	return (
		<div className="h-full flex flex-col py-4 px-4 gap-3">
			<div className="text-lg font-medium text-center">Account</div>
			<div className="flex-1 mb-1">
				<AccountState />
			</div>
			<div className="flex-1">
				<AccountScript />
			</div>
		</div>
	)
}
