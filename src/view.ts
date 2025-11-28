import { ItemView, TFile, WorkspaceLeaf, normalizePath } from 'obsidian';
import LifeCalendar from 'src/ui/LifeCalendar.svelte';
import { mount, type ComponentProps } from 'svelte';
import type LifeCalendarPlugin from 'main';
import { CreateFileModal } from 'src/createFileModal';
import {
	createFilesRecord,
	getRootFolderOfFirstDynamicSegment,
} from './lib/utils';
import {
	DEFAULT_SETTINGS,
	VIEW_TYPE_LIFE_CALENDAR,
} from './lib/calendar-constants';

/**
 * View class for the Life Calendar plugin.
 * Displays a Svelte-based calendar component that visualizes a user's life in weeks.
 */
export class LifeCalendarView extends ItemView {
	/** The mounted Svelte LifeCalendar component instance */
	lifeCalendar: ReturnType<typeof LifeCalendar> | undefined;
	/** Reference to the parent plugin instance */
	plugin: LifeCalendarPlugin;

	/**
	 * Creates a new Life Calendar view.
	 * Registers event listeners to refresh the view when files are created or deleted.
	 * @param leaf - The workspace leaf where this view will be displayed
	 * @param plugin - The parent plugin instance
	 */
	constructor(leaf: WorkspaceLeaf, plugin: LifeCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
		// Refresh the view when a new file is created or deleted
		this.registerEvent(this.app.vault.on('create', this.onFileChange));
		this.registerEvent(this.app.vault.on('delete', this.onFileChange));
	}

	/**
	 * Event handler called when files are created or deleted in the vault.
	 * Triggers a refresh of all Life Calendar views to update weekly note indicators.
	 */
	onFileChange = (): void => this.plugin.refreshLifeCalendarView();

	/**
	 * Returns the unique view type identifier for this view.
	 * @returns The view type string used to register and identify this view
	 */
	getViewType(): string {
		return VIEW_TYPE_LIFE_CALENDAR;
	}

	/**
	 * Returns the display name for this view.
	 * @returns The human-readable name shown in the UI
	 */
	getDisplayText(): string {
		return 'Life in weeks calendar';
	}

	/**
	 * Called when the view is opened.
	 * Mounts the Svelte component to render the calendar.
	 * @returns Promise that resolves when the view is ready
	 */
	override onOpen() {
		this.mountComponent();
		return Promise.resolve();
	}

	/**
	 * Retrieves all files within a specified folder path.
	 * @param folderPath - The path of the folder to search for files (use '' for root)
	 * @returns An array of TFile objects found in the folder or empty array if folder doesn't exist
	 */
	private getAllFilesInFolder(folderPath: string): TFile[] {
		// Normalize empty string or '/' to root
		const normalizedPath =
			!folderPath || folderPath === '/' ? '' : folderPath;

		const folder = this.app.vault.getAbstractFileByPath(normalizedPath);

		// Check if folder exists and is actually a folder (TFolder)
		if (folder === undefined || folder instanceof TFile) {
			return [];
		}

		return this.app.vault.getFiles().filter((file) => {
			// Handle root folder case
			if (normalizedPath === '') return true;
			return file.path.startsWith(normalizePath(normalizedPath + '/'));
		});
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
		// Correct for any dynamic segments in the folder path
		const correctedFolderPath =
			getRootFolderOfFirstDynamicSegment(folderPath);
		const files = this.getAllFilesInFolder(correctedFolderPath);
		return createFilesRecord(fileNamePattern, weekStartDay, files);
	}

	/**
	 * Retrieves the user's birthdate from settings or returns the default value.
	 * @returns The birthdate string in YYYY-MM-DD format
	 */
	private getBirthdateFromSettings() {
		return this.plugin.settings.birthdate || DEFAULT_SETTINGS.birthdate;
	}

	/**
	 * Retrieves the user's projected lifespan from settings or returns the default value.
	 * @returns The projected lifespan in years as a string
	 */
	private getProjectedLifespanFromSettings() {
		return (
			this.plugin.settings.projectedLifespan ||
			DEFAULT_SETTINGS.projectedLifespan
		);
	}

	/**
	 * Retrieves the calendar display mode from settings or returns the default value.
	 * @returns The calendar mode ('basic' or 'yearly')
	 */
	private getCalendarModeFromSettings() {
		return (
			this.plugin.settings.calendarMode || DEFAULT_SETTINGS.calendarMode
		);
	}

	/**
	 * Retrieves weekly note settings from the Journals plugin if sync is enabled.
	 * @returns Journal plugin settings object or undefined if sync is disabled or plugin not found
	 */
	private getJournalsPluginSettings() {
		return this.plugin.settings.syncWithJournalNotes
			? this.plugin.journalPluginWeeklySettings()
			: undefined;
	}

	/**
	 * Retrieves weekly note settings from the Periodic Notes plugin if sync is enabled.
	 * @returns Periodic Notes plugin settings object or undefined if sync is disabled or plugin not found
	 */
	private getPeriodicNotesPluginSettings() {
		return this.plugin.settings.syncWithWeeklyNotes
			? this.plugin.periodicNotesPluginWeeklySettings()
			: undefined;
	}

	/**
	 * Determines the week start day based on plugin integrations or user settings.
	 * Priority order:
	 * If Periodic Notes enabled: Calendar settings > Default
	 * Otherwise: Journals > Plugin settings > Default
	 * @returns The week start day as a string (e.g., 'monday', 'sunday')
	 */
	private getWeekStartsOnFromSettings() {
		const journalSettings = this.getJournalsPluginSettings();
		const periodicNotesSettings = this.getPeriodicNotesPluginSettings();
		return (
			journalSettings?.weekStartDay ??
			periodicNotesSettings?.weekStartDay ??
			this.plugin.settings.weekStartDay ??
			DEFAULT_SETTINGS.weekStartDay
		);
	}

	/**
	 * Determines the folder path for weekly notes based on plugin integrations or user settings.
	 * Priority order: Journals > Periodic Notes > Plugin settings > Default (root)
	 * @returns The folder path where weekly notes are stored
	 */
	private getFolderPath() {
		const journalSettings = this.getJournalsPluginSettings();
		const periodicNotesSettings = this.getPeriodicNotesPluginSettings();
		return (
			journalSettings?.folderPath ??
			periodicNotesSettings?.folderPath ??
			this.plugin.settings.fileLocation ??
			DEFAULT_SETTINGS.fileLocation
		);
	}

	/**
	 * Determines the file naming pattern for weekly notes based on plugin integrations or user settings.
	 * Priority order: Journals > Periodic Notes > Plugin settings > Default pattern
	 * @returns The Moment.js format pattern for weekly note file names
	 */
	private getFileNamePattern() {
		const journalSettings = this.getJournalsPluginSettings();
		const periodicNotesSettings = this.getPeriodicNotesPluginSettings();
		return (
			journalSettings?.fileNamePattern ??
			periodicNotesSettings?.fileNamePattern ??
			this.plugin.settings.fileNamePattern ??
			DEFAULT_SETTINGS.fileNamePattern
		);
	}

	/**
	 * Determines the template file path for new weekly notes based on plugin integrations or user settings.
	 * Priority order: Journals > Periodic Notes > Plugin settings > Default (empty)
	 * @returns The path to the template file, or empty string if no template is set
	 */
	private getTemplatePath() {
		const journalSettings = this.getJournalsPluginSettings();
		const periodicNotesSettings = this.getPeriodicNotesPluginSettings();
		return (
			journalSettings?.templatePath ??
			periodicNotesSettings?.templatePath ??
			this.plugin.settings.templatePath ??
			DEFAULT_SETTINGS.templatePath
		);
	}

	/**
	 * Creates a modal function for confirming weekly note creation, if enabled in settings.
	 * @returns A function that opens a confirmation modal, or undefined if confirmation is disabled
	 */
	private getModalFunction() {
		const settings = this.plugin.settings;
		return (settings.confirmBeforeCreatingWeeklyNote ??
			DEFAULT_SETTINGS.confirmBeforeCreatingWeeklyNote)
			? (message: string, cb: () => void) => {
					new CreateFileModal(this.app, message, cb).open();
				}
			: undefined;
	}

	/**
	 * Builds the props object to be passed into the Svelte LifeCalendar component
	 * @returns Props object for LifeCalendar component
	 */
	private buildComponentProps(): ComponentProps<typeof LifeCalendar> {
		const birthdate = this.getBirthdateFromSettings();
		const projectedLifespan = this.getProjectedLifespanFromSettings();
		const calendarMode = this.getCalendarModeFromSettings();
		const weekStartsOn = this.getWeekStartsOnFromSettings();
		const folderPath = this.getFolderPath();
		const fileNamePattern = this.getFileNamePattern();
		const templatePath = this.getTemplatePath();
		const modalFn = this.getModalFunction();

		// Get all weekly notes based on setting values
		const allWeeklyNotes = this.getAllWeeklyNotesFromFolder(
			folderPath,
			fileNamePattern,
			weekStartsOn,
		);
		return {
			birthdate,
			projectedLifespan,
			calendarMode,
			modalFn,
			weekStartsOn,
			allWeeklyNotes,
			folderPath,
			fileNamePattern,
			templatePath,
			app: this.app,
		};
	}

	/**
	 * Mounts the Svelte LifeCalendar component into the view's content element.
	 * Builds the component props from current settings and passes them to the Svelte component.
	 */
	private mountComponent(): void {
		this.lifeCalendar = mount(LifeCalendar, {
			target: this.contentEl,
			props: this.buildComponentProps(),
		});
	}

	/**
	 * Cleans up and destroys the Svelte component instance.
	 * Calls the Svelte $destroy method if available and clears the content element.
	 * This prevents memory leaks and ensures proper cleanup before remounting.
	 */
	private cleanupComponent(): void {
		if (this.lifeCalendar) {
			// @ts-ignore - ignore Svelte internal method
			this.lifeCalendar.$destroy?.();
			this.lifeCalendar = undefined;
		}
		this.contentEl.empty();
	}

	/**
	 * Refreshes the view by cleaning up and remounting the component.
	 * Called when settings change or when weekly notes are created/deleted.
	 * This ensures the calendar reflects the latest state and configuration.
	 */
	refreshView(): void {
		// Cleanup properly before mounting new component
		this.cleanupComponent();
		this.mountComponent();
	}

	/**
	 * Called when the view is closed.
	 * Performs cleanup to prevent memory leaks by destroying the Svelte component.
	 * @returns Promise that resolves when cleanup is complete
	 */
	override onClose() {
		this.cleanupComponent();
		return Promise.resolve();
	}
}
