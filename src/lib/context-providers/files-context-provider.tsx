'use client';

import React, { PropsWithChildren, createContext, useCallback, useContext, useState } from 'react';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import { TRANSACTION_SCRIPT } from '@/lib/consts/transaction';
import { EditorFiles } from '@/lib/files';
import { debounce } from 'lodash';

interface FilesContextProps {
	files: EditorFiles;
	selectedFileId: string | null;
	updateFileContent: (fileId: string, content: string) => void;
	selectFile: (fileId: string) => void;
	closeFile: (fileId: string) => void;
	removeFile: (fileId: string) => void;
	addFiles: (files: EditorFiles) => void;
}

export const FilesContext = createContext<FilesContextProps>({
	files: {},
	selectedFileId: null,
	updateFileContent: () => {},
	selectFile: () => {},
	closeFile: () => {},
	removeFile: () => {},
	addFiles: () => {}
});

export const FilesContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [files, setFiles] = useState<EditorFiles>({
		[TRANSACTION_SCRIPT_FILE_ID]: {
			id: TRANSACTION_SCRIPT_FILE_ID,
			name: 'Transaction script',
			content: { value: TRANSACTION_SCRIPT },
			isOpen: false,
			readonly: false,
			variant: 'script'
		}
	});

	const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

	const updateFileContent = useCallback((fileId: string, content: string) => {
		setFiles((prev) => {
			const updatedFile = {
				...prev[fileId],
				content: prev[fileId].content.dynamic
					? prev[fileId].content
					: { ...prev[fileId].content, value: content }
			};

			const updatedFiles = { ...prev, [fileId]: updatedFile };

			return updatedFiles;
		});
	}, []);

	const removeFile = debounce((fileId: string) => {
		setFiles((prev) => {
			const newFiles = { ...prev };
			delete newFiles[fileId];
			return newFiles;
		});
	}, 1000);

	const selectFile = useCallback((fileId: string) => {
		setFiles((prev) => {
			const prevIsOpen = prev[fileId]?.isOpen;
			const file = { ...prev[fileId], isOpen: true, openOrder: Date.now() };
			if (!prevIsOpen) {
				file.positionOrder = Date.now();
			}
			return {
				...prev,
				[fileId]: file
			};
		});
		setSelectedFileId(fileId);
	}, []);

	const closeFile = useCallback(
		(fileId: string) => {
			setFiles((prev) => {
				const newFiles = { ...prev, [fileId]: { ...prev[fileId], isOpen: false } };
				if (selectedFileId === fileId) {
					const openFiles = Object.values(newFiles).filter((file) => file.isOpen);
					if (openFiles.length > 0) {
						const fileWithHighestOrder = openFiles.reduce((prev, current) => {
							return (prev.openOrder || 0) > (current.openOrder || 0) ? prev : current;
						});
						setSelectedFileId(fileWithHighestOrder.id);
					} else {
						setSelectedFileId(null);
					}
				}
				return newFiles;
			});
		},
		[selectedFileId]
	);

	const addFiles = useCallback((newFiles: EditorFiles) => {
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, []);

	return (
		<FilesContext.Provider
			value={{
				files,
				selectedFileId,
				updateFileContent,
				selectFile,
				closeFile,
				removeFile,
				addFiles
			}}
		>
			{children}
		</FilesContext.Provider>
	);
};

export const useFiles = () => {
	const context = useContext(FilesContext);
	if (!context) {
		throw new Error('useFiles must be used within a FilesContextProvider');
	}
	return context;
};
