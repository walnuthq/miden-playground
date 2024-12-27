import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateId(): string {
	return Math.random().toString(36).substring(2, 11);
}

export function convertToBigUint64Array(values: (string | number)[]): BigUint64Array {
	return new BigUint64Array(
		values.map((value) => {
			if (typeof value === 'string') {
				// Check if the string is a hexadecimal
				if (value.startsWith('0x') || value.startsWith('0X')) {
					return BigInt(value);
				} else {
					return BigInt(parseInt(value, 10));
				}
			} else {
				return BigInt(value);
			}
		})
	);
}
