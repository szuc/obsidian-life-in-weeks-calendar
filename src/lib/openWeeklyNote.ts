import {
	type App,
	type MarkdownView,
	TFile,
	type WorkspaceLeaf,
	moment,
} from 'obsidian';
import { dateToDailyNoteRecordKeyFormat } from './utils';
import { DEFAULT_SETTINGS } from './calendar-constants';

/**
 * Opens a file in the workspace, reusing an existing tab if the file is already open.
 * If the file is already open in a leaf, reveals that leaf. Otherwise, creates a new leaf.
 * @param app - Obsidian application instance
 * @param file - The file to open
 * @returns Promise<void>
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

async function getTemplateContent(
	app: App,
	templatePath: string,
): Promise<string> {
	let templateContent = '';
	if (templatePath && templatePath.trim() !== '') {
		try {
			const templateFile = app.vault.getAbstractFileByPath(templatePath);
			if (
				templateFile instanceof TFile &&
				templateFile.extension === 'md'
			) {
				templateContent = await app.vault.read(templateFile);
			} else {
				console.warn(
					`Template file not found at: ${templatePath}. Creating note without template.`,
				);
			}
		} catch (error) {
			console.warn(
				`Error reading template file at: ${templatePath}. Creating note without template.`,
				error,
			);
		}
	}
	return templateContent;
}

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
		fileNamePattern || DEFAULT_SETTINGS.fileNamePattern,
	);
	const filePath = folderPath
		? `${folderPath}/${filename}.md`
		: `${filename}.md`;

	let weeklyNote: TFile | undefined =
		allWeeklyNotes?.[dateToDailyNoteRecordKeyFormat(date)];

	let templateContent = await getTemplateContent(app, templatePath);

	if (!weeklyNote) {
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
		await openFile(app, weeklyNote);
	}
};
