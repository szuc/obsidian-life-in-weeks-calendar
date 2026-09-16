import {
	type App,
	type MarkdownView,
	TFile,
	type WorkspaceLeaf,
	moment,
	normalizePath,
} from 'obsidian';
import {
	dateToWeeklyNoteRecordKeyFormat,
	dateToYYYYMMDD,
	isStringDynamic,
	parseDynamicFolderPath,
	parseDynamicDatesInString,
	parseTemplateVariables,
} from './utils';
import { DEFAULT_SETTINGS } from './calendar-constants';
import { getJournalsApi } from 'obsidian-journals-api';

/**
 * Opens a file in the workspace, reusing an existing tab if the file is already open.
 * If the file is already open in a leaf, reveals that leaf. Otherwise, creates a new leaf.
 * @param app - Obsidian application instance
 * @param file - The file to open
 * @returns Promise<void>
 */
async function openFile(app: App, file: TFile) {
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
		const newLeaf = app.workspace.getLeaf();
		await newLeaf.openFile(file, { active: true });
	}
}

/**
 * Ensures that a folder exists in the vault, creating it if necessary.
 * Silently ignores errors if the folder already exists. Logs other errors to console.
 * @param app - The Obsidian App instance
 * @param folderPath - The path of the folder to create (e.g., "Journals/2024")
 * @returns Promise<void>
 * @example
 * await ensureFolderExists(app, "Journals/Weekly")
 * // Folder "Journals/Weekly" now exists in the vault
 */
async function ensureFolderExists(app: App, folderPath: string) {
	try {
		await app.vault.createFolder(folderPath);
	} catch (error: unknown) {
		// Folder might already exist, ignore
		if (!(
			error instanceof Error && error.message.includes('already exists')
		)) {
			console.error('Error creating weekly notes folder:', error);
		}
	}
}

/**
 * Retrieves the content of a template file from the vault.
 * Returns an empty string if the template path is empty, the file doesn't exist, or an error occurs.
 * @param app - The Obsidian App instance
 * @param templatePath - The vault path to the template file (e.g., "Templates/Weekly.md")
 * @returns A promise that resolves to the template content as a string, or an empty string if unavailable
 * @example
 * const content = await getTemplateContent(app, "Templates/Weekly.md")
 * // Returns the content of the template file, or "" if not found
 */
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
 * Creates a new weekly note file with template content and opens it.
 * If the file already exists, opens the existing file instead.
 * Ensures the parent folder exists before creating the file.
 * @param app - The Obsidian App instance
 * @param filePath - The full path where the note should be created (e.g., "Journals/2024/2024-W11.md")
 * @param templateContent - The content to write to the new file (may include processed template variables)
 * @param folderPath - The folder path where the note will be created (used to ensure folder exists)
 * @returns A promise that resolves when the note is created and opened, or when an existing note is opened
 * @example
 * await createWeeklyNote(app, "Journals/2024-W11.md", "# Week 11\n\n2024-03-15", "Journals")
 * // Creates and opens the weekly note, or opens it if it already exists
 */
async function createWeeklyNote(
	app: App,
	filePath: string,
	templateContent: string,
	folderPath: string,
) {
	ensureFolderExists(app, folderPath)
		.then(async () => {
			return await app.vault.create(filePath, templateContent);
		})
		.then(async (newNote) => {
			await openFile(app, newNote);
		})
		.catch(async (error: unknown) => {
			if (
				error instanceof Error &&
				error.message.includes('already exists')
			) {
				// Try to open the existing file
				const existingFile = app.vault.getAbstractFileByPath(filePath);
				if (existingFile instanceof TFile) {
					await openFile(app, existingFile);
					return;
				}
			}
			console.error('Error creating or opening weekly note:', error);
		});
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
	syncWithJournalNotes?: boolean,
): Promise<void> => {
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		throw new Error(
			'openWeeklyNoteFunction: date must be a valid Date object',
		);
	}

	if (syncWithJournalNotes) {
		const journals = getJournalsApi(app);
		if (journals) {
			const dateInput = dateToYYYYMMDD(date);
			const [note] = await journals.notesFor(
				{ writeType: 'week' },
				dateInput,
			);
			if ((!note || !note.file) && modalFn) {
				modalFn(
					`Weekly note for week starting ${date.toDateString()} does not exist. Do you want to create it now?`,
					() => {
						void journals.openNote(
							{ writeType: 'week' },
							dateInput,
							{ confirm: false },
						);
					},
				);
			} else {
				await journals.openNote({ writeType: 'week' }, dateInput, {
					confirm: false,
				});
			}
			return;
		}
	}

	const momentFn = moment as unknown as (
		input?: unknown,
		format?: string,
		strict?: boolean,
	) => import('moment').Moment;
	const momentObject = momentFn(date);

	// filenames might be pure moment formats, e.g., "YYYY-WW" or might contain dynamic segments
	// like "Weekly-{{date:gggg-[W]ww}}". We handle each differently.
	const filename = isStringDynamic(fileNamePattern)
		? parseDynamicDatesInString(
				fileNamePattern,
				date,
				DEFAULT_SETTINGS.fileNamePattern,
			)
		: // Pure moment format - no dynamic segments
			momentObject.format(
				fileNamePattern || DEFAULT_SETTINGS.fileNamePattern,
			);

	// Paths might use dynamic segments like {{date}} which need to be resolved
	const parsedFolderPath = parseDynamicFolderPath(folderPath, date);

	const filePath = normalizePath(
		parsedFolderPath
			? `${parsedFolderPath}/${filename}.md`
			: `${filename}.md`,
	);

	const weeklyNote: TFile | undefined =
		allWeeklyNotes?.[dateToWeeklyNoteRecordKeyFormat(date)];

	const templateContent = await getTemplateContent(app, templatePath);
	const parsedTemplateContent = templateContent
		? parseTemplateVariables(templateContent, date, filename)
		: '';

	if (!weeklyNote) {
		if (modalFn) {
			modalFn(
				`Weekly note for week starting ${date.toDateString()} does not exist. Do you want to create a file named ${filename} now?`,
				() => {
					void createWeeklyNote(
						app,
						filePath,
						parsedTemplateContent,
						parsedFolderPath,
					);
				},
			);
		} else {
			await createWeeklyNote(
				app,
				filePath,
				parsedTemplateContent,
				parsedFolderPath,
			);
		}
	} else {
		await ensureFolderExists(app, parsedFolderPath);
		await openFile(app, weeklyNote);
	}
};
