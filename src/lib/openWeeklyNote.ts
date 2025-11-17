import {
	type App,
	type MarkdownView,
	type TFile,
	type WorkspaceLeaf,
	moment,
} from 'obsidian';
import {
	createWeeklyNote,
	getWeeklyNoteSettings,
	appHasDailyNotesPluginLoaded,
} from 'obsidian-daily-notes-interface';
import { dateToDailyNoteRecordKeyFormat } from './utils';
import { DEFAULT_SETTINGS } from './calendar-constants';

/**
 * Opens a file in the workspace, reusing an existing tab if the file is already open.
 * If the file is already open in a leaf, reveals that leaf. Otherwise, creates a new leaf.
 * @param app - Obsidian application instance
 * @param file - The file to open
 */
const openFile = async (app: App, file: TFile) => {
	let leaf = null;

	app.workspace.getLeavesOfType('markdown').forEach((l: WorkspaceLeaf) => {
		const markdownView = l.view as MarkdownView;
		if (markdownView.file?.path === file.path) {
			leaf = l;
			return;
		}
	});

	if (leaf) {
		await app.workspace.revealLeaf(leaf);
	} else {
		const newLeaf = app.workspace.getLeaf(true);
		await newLeaf.openFile(file, { active: true });
	}
};

/**
 * Opens a weekly note for the given date using custom file naming and folder settings.
 * If the note doesn't exist, creates it (optionally with user confirmation).
 * @param app - Obsidian application instance
 * @param date - The date within the week to open
 * @param allWeeklyNotes - Record of existing weekly notes
 * @param folderPath - Custom folder path where weekly notes are stored
 * @param fileNamePattern - Custom Moment.js format pattern for file naming
 * @param templatePath - Custom template path for new notes
 * @param modalFn - Optional function to show confirmation modal before creating a new note
 */
export const openWeeklyNoteFunction = async (
	app: App,
	date: Date,
	allWeeklyNotes: Record<string, TFile> | undefined,
	folderPath: string,
	fileNamePattern: string,
	templatePath: string,
	modalFn?: (message: string, cb: () => void) => void,
): Promise<void> => {
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		throw new Error(
			'openWeeklyNoteFunction: date must be a valid Date object',
		);
	}

	const momentObject = moment(date);
	const filename = momentObject.format(
		fileNamePattern || DEFAULT_SETTINGS.fileNamingPattern,
	);
	const filePath = folderPath
		? `${folderPath}/${filename}.md`
		: `${filename}.md`;

	let dailyNote: TFile | undefined =
		allWeeklyNotes?.[dateToDailyNoteRecordKeyFormat(date)];

	let templateContent = '';

	try {
		const templateFile = app.vault.getAbstractFileByPath(
			templatePath, // This is the path to the template file
		) as TFile;
		if (!templateFile || templateFile.extension !== 'md') {
			console.error(`Template file not found at: ${templatePath}`);
			return;
		}
		templateContent = await app.vault.read(templateFile);
	} catch (error) {
		console.error(`Error reading template file at: ${templatePath}`, error);
		return;
	}

	if (!dailyNote) {
		if (modalFn) {
			modalFn(
				`Weekly note for week starting ${date.toDateString()} does not exist. Do you want to create a file named ${filename} now?`,
				() => {
					app.vault
						.create(filePath, templateContent)
						.then(async (newNote) => {
							await openFile(app, newNote);
						})
						.catch((error) => {
							console.error(
								'Error creating or opening weekly note:',
								error,
							);
						});
				},
			);
		} else {
			const newNote = await app.vault.create(filePath, templateContent);
			await openFile(app, newNote);
		}
	} else {
		await openFile(app, dailyNote);
	}
};

/**
 * Opens a weekly note for the given date using periodic notes plugin settings.
 * If the note doesn't exist, creates it using the periodic notes plugin (optionally with user confirmation).
 * @param app - Obsidian application instance
 * @param date - The date within the week to open
 * @param allWeeklyNotes - Record of existing weekly notes
 * @param modalFn - Optional function to show confirmation modal before creating a new note
 */
export const openPeriodicNoteFunction = async (
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
	const filename = momentObject.format(
		format || DEFAULT_SETTINGS.fileNamingPattern,
	);

	let dailyNote: TFile | undefined =
		allWeeklyNotes?.[dateToDailyNoteRecordKeyFormat(date)];

	if (!dailyNote) {
		if (modalFn) {
			modalFn(
				`Weekly note for week starting ${date.toDateString()} does not exist. Do you want to create a file named ${filename} now?`,
				() => {
					createWeeklyNote(momentObject)
						.then(async (newNote) => {
							await openFile(app, newNote);
						})
						.catch((error) => {
							console.error(
								'Error creating or opening weekly note:',
								error,
							);
						});
				},
			);
		} else {
			const newNote = await createWeeklyNote(momentObject);
			await openFile(app, newNote);
		}
	} else {
		await openFile(app, dailyNote);
	}
};
