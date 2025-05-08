import { useMiden } from '@/lib/context-providers';
import React, { useEffect, useState } from 'react';
import { FileItem, InspectorItem } from '.';
import { useToast } from '@/hooks/use-toast';
import { useNextStep } from 'nextstepjs';

const NotesList = ({
	toggleCollapse
}: {
	toggleCollapse: (
		id: string,
		setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	) => void;
}) => {
	const {
		files,
		notes,
		selectFile,
		selectedFileId,
		createSampleP2IDNote,
		createSampleP2IDRNote,
		createNewNote,
		createSampleSwapNotes,
		deleteNote,
		accounts,
		closeFile,
		removeTransactionNote,
		selectedTransactionNotesIds,
		latestConsumedNotes
	} = useMiden();
	const [collapsedNotes, setCollapsedNotes] = useState<Record<string, boolean>>({});
	const isCollapsedNotesTopLevel = collapsedNotes['top-level-notes'] || false;
	const accountsCount = Object.values(accounts).length;
	const { toast } = useToast();
	const { currentTour, currentStep, setCurrentStep } = useNextStep();

	useEffect(() => {
		if (currentTour) {
			if (currentStep === 11) {
				selectFile(Object.values(notes)[Object.values(notes).length - 1].scriptFileId);
				setCurrentStep(12, 100);
			}
		}
	}, [notes]);
	return (
		<>
			<InspectorItem
				name="Notes"
				nameClasses="font-bold"
				variant={Object.values(notes).length > 0 ? 'collapsable' : 'blank'}
				isCollapsed={isCollapsedNotesTopLevel}
				level={0}
				onClick={() => {
					if (Object.values(notes).length > 0) {
						toggleCollapse('top-level-notes', setCollapsedNotes);
					}
				}}
				onCreate={(option) => {
					if (isCollapsedNotesTopLevel) {
						toggleCollapse('top-level-notes', setCollapsedNotes);
					}
					if (option === 'Create P2ID note') {
						if (accountsCount > 1) {
							createSampleP2IDNote();
						} else {
							toast({
								title: 'Cannot create P2ID note',
								description: 'To create a P2ID note, you need to have at least two accounts.',
								variant: 'destructive'
							});
						}
					} else if (option === 'Create P2IDR note') {
						if (accountsCount > 1) {
							createSampleP2IDRNote();
						} else {
							toast({
								title: 'Cannot create P2IDR note',
								description: 'To create a P2IDR note, you need to have at least two accounts.',
								variant: 'destructive'
							});
						}
					} else if (option === 'Create SWAP note') {
						if (accountsCount > 1) {
							createSampleSwapNotes();
						} else {
							toast({
								title: 'Cannot create SWAP note',
								description: 'To create a SWAP note, you need to have at least two accounts.',
								variant: 'destructive'
							});
						}
					} else if (option === 'Create empty note') {
						createNewNote();
					}
				}}
				onCreateOptions={[
					'Create P2ID note',
					'Create P2IDR note',
					'Create SWAP note',
					'Create empty note'
				]}
			/>
			{!isCollapsedNotesTopLevel &&
				Object.values(notes)
					.filter((note) => !note.isExpectedOutput)
					.map((note) => {
						const isCollapsed = collapsedNotes[note.id] || false;
						return (
							<React.Fragment key={note.id}>
								<InspectorItem
									latestConsumedNotes={latestConsumedNotes}
									isConsumed={note.isConsumed}
									name={note.name}
									variant="collapsable"
									isCollapsed={isCollapsed}
									level={1}
									onClick={() => toggleCollapse(note.id, setCollapsedNotes)}
									onRemove={() => {
										Object.values(files).map((file) => {
											if (
												[
													note.scriptFileId,
													note.inputFileId,
													note.metadataFileId,
													note.vaultFileId
												].includes(file.id)
											) {
												closeFile(file.id);
											}
										});

										if (selectedTransactionNotesIds.includes(note.id)) {
											removeTransactionNote(note.id);
										}
										deleteNote(note.id);
									}}
								/>
								{!isCollapsed && (
									<div className="flex flex-col">
										<FileItem
											editorFile={files[note.metadataFileId]}
											onClick={() => selectFile(note.metadataFileId)}
											isSelected={selectedFileId === note.metadataFileId}
											level={2}
										/>
										<FileItem
											editorFile={files[note.scriptFileId]}
											onClick={() => selectFile(note.scriptFileId)}
											isSelected={selectedFileId === note.scriptFileId}
											level={2}
										/>
									</div>
								)}
							</React.Fragment>
						);
					})}
		</>
	);
};

export default NotesList;
