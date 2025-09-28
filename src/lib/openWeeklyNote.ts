const moment = require('moment');

import type { TFile } from 'obsidian';
import {
	createWeeklyNote,
	getWeeklyNoteSettings,
	appHasDailyNotesPluginLoaded,
} from 'obsidian-daily-notes-interface';
import { dateToDailyNoteFormatRecordKey } from './utils';

export const openWeeklyNoteFunction = async (
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

	// @ts-expect-error, not typed
	const { workspace } = window.app;
	const momentObject = moment(date);
	const { format } = getWeeklyNoteSettings();
	const filename = momentObject.format(format || 'gggg-[W]ww');

	// getWeeklyNote from obsidian-daily-notes-interface wasn't working when the week start date isn't sunday
	let dailyNote: TFile | undefined =
		allWeeklyNotes?.[dateToDailyNoteFormatRecordKey(date)];

	if (!dailyNote && modalFn === undefined) {
		dailyNote = await createWeeklyNote(filename);
	} else if (!dailyNote && modalFn !== undefined) {
		modalFn(
			`Weekly note for week starting ${date.toDateString()} does not exist. Do you want to create a file named ${filename} now?`,
			async () => {
				dailyNote = await createWeeklyNote(filename);
				if (dailyNote) {
					const leaf = workspace.getUnpinnedLeaf();
					await leaf.openFile(dailyNote, { active: true });
				}
			},
		);
		return;
	}
	const leaf = workspace.getUnpinnedLeaf();
	await leaf.openFile(dailyNote, { active: true });
};
