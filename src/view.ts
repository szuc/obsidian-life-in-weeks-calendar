import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import LifeCalendar from 'src/ui/LifeCalendar.svelte';
import { mount, type ComponentProps } from 'svelte';
import type LifeCalendarPlugin from 'main';
import { CreateFileModal } from 'src/createFileModal';
import { getAllWeeklyNotes } from 'obsidian-daily-notes-interface';
import { createFilesRecord, fixWeekRecordStartDates } from './lib/utils';
import {
	DEFAULT_SETTINGS,
	VIEW_TYPE_LIFE_CALENDAR,
} from './lib/calendar-constants';

export class LifeCalendarView extends ItemView {
	lifeCalendar: ReturnType<typeof LifeCalendar> | undefined;
	plugin: LifeCalendarPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: LifeCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
		// Refresh the view when a new file is created or deleted
		this.registerEvent(this.app.vault.on('create', this.onFileChange));
		this.registerEvent(this.app.vault.on('delete', this.onFileChange));
	}

	onFileChange = (): void => this.plugin.refreshLifeCalendarView();

	getViewType(): string {
		return VIEW_TYPE_LIFE_CALENDAR;
	}

	getDisplayText(): string {
		return 'Life in weeks calendar';
	}

	override onOpen() {
		this.mountComponent();
		return Promise.resolve();
	}

	/**
	 * Retrieves all files within a specified folder path.
	 *
	 * @param folderPath - The path of the folder to search for files
	 * @returns An array of TFile objects found in the folder, or an empty array if the folder doesn't exist or is invalid
	 */
	private getAllFilesInfolder(folderPath: string): TFile[] {
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (folder && folder instanceof TFile === false) {
			const filesInFolder: TFile[] = [];
			this.app.vault.getFiles().forEach((file) => {
				if (file.path.startsWith(folderPath + '/')) {
					filesInFolder.push(file);
				}
			});
			return filesInFolder;
		}
		return [];
	}

	/**
	 * Get all the weekly notes using the periodic notes plugin interface
	 * and correct the dates based on the week start day setting from calendar
	 * @returns Record of all weekly notes with corrected week start dates
	 */
	private getAllWeeklyPeriodicNotes(): Record<string, TFile> | undefined {
		const allWeeklyNotes = getAllWeeklyNotes();

		return fixWeekRecordStartDates(
			allWeeklyNotes,
			this.plugin.getWeekStartsOnOptionFromCalendar(),
		);
	}

	/**
	 * Gets all weekly notes from a specified folder
	 *
	 * @param folderPath - Path to the folder containing weekly notes
	 * @param fileNamePattern - Pattern used to identify weekly note files
	 * @param weekStartDay - The day considered as the start of the week
	 * @returns A record of weekly notes keyed by their start date
	 */
	private getAllWeeklyNotesFromFolder(
		folderPath: string,
		fileNamePattern: string,
		weekStartDay: string,
	): Record<string, TFile> | undefined {
		const files = this.getAllFilesInfolder(folderPath);
		return createFilesRecord(fileNamePattern, weekStartDay, files);
	}

	/**
	 * Builds the props object to be passed into the Svelte LifeCalendar component
	 * @returns Props object for LifeCalendar component
	 */
	private buildComponentProps(): ComponentProps<typeof LifeCalendar> {
		const settings = this.plugin.settings;
		// Birthday from settings or default
		const birthdate = settings.birthdate ?? DEFAULT_SETTINGS.birthdate;
		// Projected lifespan from settings or default
		const projectedLifespan =
			settings.projectedLifespan ?? DEFAULT_SETTINGS.projectedLifespan;
		// Calendar mode from settings or default
		const calendarMode =
			settings.calendarMode ?? DEFAULT_SETTINGS.calendarMode;
		// Determine if periodic notes plugin setting values should be used
		const usePeriodicNotes =
			(this.plugin.weeklyPeriodicNotesPluginExists() &&
				settings.syncWithWeeklyNotes) ??
			false;
		// Week start day from settings or default or periodic notes plugin
		const weekStartsOn = usePeriodicNotes
			? (this.plugin.getWeekStartsOnOptionFromCalendar() ??
				DEFAULT_SETTINGS.weekStartDay)
			: (settings.weekStartDay ?? DEFAULT_SETTINGS.weekStartDay);
		// Folder path and file naming pattern from settings or defaults
		const folderPath = settings.fileLocation ?? '';
		// File naming pattern from settings or default
		const fileNamePattern =
			settings.fileNamingPattern ?? DEFAULT_SETTINGS.fileNamingPattern;
		const templatePath =
			settings.templatePath ?? DEFAULT_SETTINGS.templatePath;
		// Function to create a new modal window with message and callback
		// only if setting to prompt for file creation is enabled
		const modalFn =
			(settings.confirmBeforeCreatingWeeklyNote ??
			DEFAULT_SETTINGS.confirmBeforeCreatingWeeklyNote)
				? (message: string, cb: () => void) => {
						new CreateFileModal(this.app, message, cb).open();
					}
				: undefined;
		// Get all weekly notes based on setting values
		const allWeeklyNotes = usePeriodicNotes
			? this.getAllWeeklyPeriodicNotes()
			: this.getAllWeeklyNotesFromFolder(
					folderPath,
					fileNamePattern,
					weekStartsOn,
				);
		return {
			birthdate,
			projectedLifespan,
			calendarMode,
			modalFn,
			usePeriodicNotes,
			weekStartsOn,
			allWeeklyNotes,
			folderPath,
			fileNamePattern,
			templatePath,
			app: this.app,
		};
	}

	private mountComponent(): void {
		this.lifeCalendar = mount(LifeCalendar, {
			target: this.contentEl,
			props: this.buildComponentProps(),
		});
	}

	private cleanupComponent(): void {
		if (this.lifeCalendar) {
			// @ts-ignore - ignore Svelte internal method
			this.lifeCalendar.$destroy?.();
			this.lifeCalendar = undefined;
		}
		this.contentEl.empty();
	}

	refreshView(): void {
		// Cleanup properly before mounting new component
		this.cleanupComponent();
		this.mountComponent();
	}

	override onClose() {
		this.cleanupComponent();
		return Promise.resolve();
	}
}
