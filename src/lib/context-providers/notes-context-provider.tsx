'use client';

import React, {
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useState,
	useRef
} from 'react';
import { createNoteData } from '@/lib/miden-wasm-api';
import { convertToBigUint64Array } from '@/lib/utils';
import { createP2IDRNote, createSwapNote, Note } from '@/lib/notes';
import { createP2IDNote } from '@/lib/notes/p2id';
import json5 from 'json5';
import { useFiles } from './files-context-provider';
import { useAccounts } from './accounts-context-provider';

interface NotesContextProps {
	notes: Record<string, Note>;
	selectedTransactionNotesIds: string[];
	createSampleP2IDNote: () => void;
	createSampleP2IDRNote: () => void;
	selectTransactionNote: (noteId: string) => void;
	removeTransactionNote: (noteId: string) => void;
	createNewNote: () => void;
	createSampleSwapNotes: () => void;
	deleteNote: (noteId: string) => void;
	updateNoteAssetAmount: (
		noteId: string,
		faucetId: string,
		updateFn: (amount: bigint) => bigint
	) => void;
	handleChangeInput: (noteId: string, newInput: string, index: number) => void;
	updateRecipientDigest: (noteId: string) => void;
	setNoteTag: (noteId: string, tag: number) => void;
	setNoteAux: (noteId: string, aux: bigint) => void;
	latestConsumedNotes: Record<string, Note>;
	setLatestConsumedNotes: (latestConsumedNotes: Record<string, Note>) => void;
}

export const NotesContext = createContext<NotesContextProps>({
	notes: {},
	selectedTransactionNotesIds: [],
	createSampleP2IDNote: () => {},
	createSampleP2IDRNote: () => {},
	selectTransactionNote: () => {},
	removeTransactionNote: () => {},
	createNewNote: () => {},
	createSampleSwapNotes: () => {},
	deleteNote: () => {},
	updateNoteAssetAmount: () => {},
	handleChangeInput: () => {},
	updateRecipientDigest: () => {},
	setNoteTag: () => {},
	setNoteAux: () => {},
	latestConsumedNotes: {},
	setLatestConsumedNotes: () => {}
});

export const NotesContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { files, addFiles, updateFileContent, removeFile } = useFiles();
	const { accounts, selectedTransactionAccountId, updateAccountById } = useAccounts();

	const setNoteTag = (noteId: string, tag: number) => {
		updateNoteById(noteId, (note) => {
			note.tag = tag;
			return note;
		});
	};

	const setNoteAux = (noteId: string, aux: bigint) => {
		updateNoteById(noteId, (note) => {
			note.aux = aux;
			return note;
		});
	};

	const handleChangeInput = (noteId: string, newInput: string, index: number) => {
		const note = notes[noteId];
		try {
			let currentInputs = [];

			if (files[note!.inputFileId].content.value) {
				try {
					currentInputs = json5.parse(files[note!.inputFileId].content.value!);
				} catch (error) {
					console.error(error);
					currentInputs = [];
				}
			}

			if (!Array.isArray(currentInputs)) {
				currentInputs = [];
			}
			currentInputs[index] = newInput;

			updateFileContent(note!.inputFileId, JSON.stringify(currentInputs));
		} catch (error) {
			console.error(error);
		}
		updateRecipientDigest(noteId);
	};

	const [notes, setNotes] = useState<Record<string, Note>>({});
	const [latestConsumedNotes, setLatestConsumedNotes] = useState<Record<string, Note>>({});
	const [selectedTransactionNotesIds, setSelectedTransactionNotesIds] = useState<string[]>([]);

	// add a ref to store debounce timeouts per note and delay constant
	const digestTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
	const RECIPIENT_DIGEST_DEBOUNCE_DELAY_MS = 5000;

	const updateRecipientDigest = useCallback(
		(noteId: string) => {
			// debounce per noteId
			if (digestTimeoutsRef.current[noteId]) {
				clearTimeout(digestTimeoutsRef.current[noteId]);
			}
			digestTimeoutsRef.current[noteId] = setTimeout(() => {
				const note = notes[noteId];
				const sender = accounts[note.senderId];
				const noteData = createNoteData(
					note,
					convertToBigUint64Array(json5.parse(files[note.inputFileId].content.value!)),
					files[note.scriptFileId].content.value!,
					files[sender.scriptFileId].content.value!
				);
				const recipientDigest = noteData.recipient_digest();
				updateNoteById(noteId, (note) => {
					note.recipientDigest = recipientDigest;
					return note;
				});
				delete digestTimeoutsRef.current[noteId];
			}, RECIPIENT_DIGEST_DEBOUNCE_DELAY_MS);
		},
		[accounts, files, notes]
	);

	const updateNoteById = (noteId: string, updateFn: (note: Note) => Note) => {
		setNotes((prev) => {
			const note = prev[noteId];
			const updatedNote = updateFn(note.clone());
			return { ...prev, [noteId]: updatedNote };
		});
	};

	const selectTransactionNote = useCallback((noteId: string) => {
		setSelectedTransactionNotesIds((prev) => {
			if (prev.includes(noteId)) {
				return prev;
			}
			return [...prev, noteId];
		});
	}, []);

	const createSampleSwapNotes = useCallback(() => {
		const receiver = selectedTransactionAccountId
			? accounts[selectedTransactionAccountId]
			: Object.values(accounts)[0];
		const sender = Object.values(accounts).filter((account) => account.id !== receiver.id)[0];
		const offeredAssetOfSender = sender.assets[0];
		const requestedAssetOfReceiver = receiver.assets.filter(
			(asset) => asset.faucetId !== offeredAssetOfSender.faucetId
		)[0];

		const offeredAsset = { ...offeredAssetOfSender, amount: 10n };
		const requestedAsset = { ...requestedAssetOfReceiver, amount: 10n };

		const { note, newFiles, paybackNote } = createSwapNote({
			senderId: sender.id,
			receiverId: receiver.id,
			offeredAsset,
			requestedAsset,
			name: 'SWAP',
			senderScript: files[sender.scriptFileId].content.value!
		});

		updateAccountById(sender.id.id, (account) => {
			account.updateAssetAmount(offeredAsset.faucetId, (amount) => amount - offeredAsset.amount);
			return account;
		});

		setNotes((prev) => ({ ...prev, [note.id]: note, [paybackNote.id]: paybackNote }));
		addFiles(newFiles);
	}, [accounts, selectedTransactionAccountId, files, addFiles]);

	const createSampleP2IDNote = useCallback(() => {
		const receiverId = selectedTransactionAccountId
			? accounts[selectedTransactionAccountId].id
			: Object.values(accounts)[0].id;
		const senderId = Object.values(accounts).filter((account) => account.id !== receiverId)[0].id;
		const assets = [{ ...accounts[senderId.id].assets[0], amount: 10n }];
		const sender = accounts[senderId.id];

		const { note, newFiles } = createP2IDNote({
			senderId,
			receiverId,
			assets,
			name: 'P2ID',
			senderScript: files[sender.scriptFileId].content.value!
		});
		setNotes((prev) => ({ ...prev, [note.id]: note }));
		addFiles(newFiles);
	}, [accounts, selectedTransactionAccountId, files, addFiles]);

	const createSampleP2IDRNote = useCallback(() => {
		const receiverId = selectedTransactionAccountId
			? accounts[selectedTransactionAccountId].id
			: Object.values(accounts)[0].id;
		const senderId = Object.values(accounts).filter((account) => account.id.id !== receiverId.id)[0]
			.id;
		const sender = accounts[senderId.id];
		const assets = [{ ...sender.assets[0], amount: 10n }];
		const { note, newFiles } = createP2IDRNote({
			senderId,
			receiverId,
			reclaimBlockHeight: 20,
			assets,
			name: 'P2IDR',
			senderScript: files[sender.scriptFileId].content.value!
		});

		setNotes((prev) => ({ ...prev, [note.id]: note }));
		addFiles(newFiles);
	}, [accounts, selectedTransactionAccountId, files, addFiles]);

	const createSampleNote = useCallback(() => {
		const senderId = Object.values(accounts)[0].id;
		const { note, newFiles } = Note.createEmptyNote({
			senderId: senderId.id,
			assets: [],
			name: 'NOTE'
		});

		setNotes((prev) => ({ ...prev, [note.id]: note }));
		addFiles(newFiles);
	}, [accounts, addFiles]);

	const removeTransactionNote = useCallback((noteId: string) => {
		setSelectedTransactionNotesIds((prev) => prev.filter((id) => id !== noteId));
	}, []);

	const deleteNote = useCallback(
		(noteId: string) => {
			setNotes((prev) => {
				const newNotes = { ...prev };
				const note = newNotes[noteId];
				if (note) {
					removeFile(note.inputFileId);
					removeFile(note.scriptFileId);
					removeFile(note.metadataFileId);
					removeFile(note.vaultFileId);
					setSelectedTransactionNotesIds((prev) => prev.filter((id) => id !== noteId));
				}
				delete newNotes[noteId];
				return newNotes;
			});
		},
		[removeFile]
	);

	const updateNoteAssetAmount = (
		noteId: string,
		faucetId: string,
		updateFn: (amount: bigint) => bigint
	) => {
		setNotes((prev) => {
			const note = prev[noteId];
			if (!note) {
				console.error(`Note with ID ${noteId} not found.`);
				return prev;
			}
			note.updateAssetAmount(faucetId, updateFn);
			const updatedNotes = { ...prev, [noteId]: note };

			return updatedNotes;
		});
	};

	return (
		<NotesContext.Provider
			value={{
				notes,
				selectedTransactionNotesIds,
				createSampleP2IDNote,
				createSampleP2IDRNote,
				selectTransactionNote,
				removeTransactionNote,
				createNewNote: createSampleNote,
				createSampleSwapNotes,
				deleteNote,
				updateNoteAssetAmount,
				handleChangeInput,
				updateRecipientDigest,
				setNoteTag,
				setNoteAux,
				latestConsumedNotes,
				setLatestConsumedNotes
			}}
		>
			{children}
		</NotesContext.Provider>
	);
};

export const useNotes = () => {
	const context = useContext(NotesContext);
	if (!context) {
		throw new Error('useNotes must be used within a NotesContextProvider');
	}
	return context;
};
