const moment = require('moment');

import type { App, MarkdownView, TFile, WorkspaceLeaf } from 'obsidian';
import {
	createWeeklyNote,
	getWeeklyNoteSettings,
	appHasDailyNotesPluginLoaded,
} from 'obsidian-daily-notes-interface';
import { dateToDailyNoteFormatRecordKey } from './utils';

export const openWeeklyNoteFunction = async (
	app: App,
	date: Date,
	allWeeklyNotes: Record<string, TFile> | undefined,
	modalFn?: (message: string, cb: () => void) => void,
): Promise<void> => {
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		throw new Error(
			'openWeeklyNoteFunction: date must be a valid Date object',
		);
	}

	if (!appHasDailyNotesPluginLoaded()) return;

	const momentObject = moment(date);
	const { format } = getWeeklyNoteSettings();
	const filename = momentObject.format(format || 'gggg-[W]ww');

	const openFile = (file: TFile) => {
		let leaf = null;

		app.workspace
			.getLeavesOfType('markdown')
			.forEach((l: WorkspaceLeaf) => {
				const markdownView = l.view as MarkdownView;
				if (markdownView.file?.path === file.path) {
					leaf = l;
					return;
				}
			});

		if (leaf) {
			app.workspace.revealLeaf(leaf);
		} else {
			const newLeaf = app.workspace.getLeaf(true);
			newLeaf.openFile(file, { active: true });
		}
	};

	let dailyNote: TFile | undefined =
		allWeeklyNotes?.[dateToDailyNoteFormatRecordKey(date)];

	if (!dailyNote) {
		if (modalFn) {
			modalFn(
				`Weekly note for week starting ${date.toDateString()} does not exist. Do you want to create a file named ${filename} now?`,
				async () => {
					const newNote = await createWeeklyNote(filename);
					openFile(newNote);
				},
			);
		} else {
			const newNote = await createWeeklyNote(filename);
			openFile(newNote);
		}
	} else {
		openFile(dailyNote);
	}
};
