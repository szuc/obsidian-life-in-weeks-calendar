import { ItemView, TFile, WorkspaceLeaf, normalizePath } from 'obsidian';
import LifeCalendar from 'src/ui/LifeCalendar.svelte';
import { mount, unmount, type ComponentProps } from 'svelte';
import type LifeCalendarPlugin from 'main';
import { CreateFileModal } from 'src/createFileModal';
import {
	createFilesRecord,
	getRootFolderOfFirstDynamicSegment,
	createLocalDateYYYYMMDD,
	dateToWeeklyNoteRecordKeyFormat,
	weekStartsOnIndexToString,
	momentFn,
} from './lib/utils';
import {
	DEFAULT_SETTINGS,
	VIEW_TYPE_LIFE_CALENDAR,
} from './lib/calendar-constants';
import { refreshLifeCalendarView } from 'src/lib/viewManagement';
import {
	journalsPluginExists,
	periodicNotesPluginWeeklySettings,
} from 'src/lib/pluginIntegration';
import { getJournalsApi } from 'obsidian-journals-api';

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
	 *
	 * When the Journals plugin integration is active we also subscribe to its
	 * `noteAdded` event. The vault `create` event fires before the Journals plugin
	 * updates its internal index, so calling `existingNotes()` in that handler
	 * returns stale data. The `noteAdded` event is emitted only after the index
	 * has been updated, ensuring the refresh query sees the newly created note.
	 *
	 * @param leaf - The workspace leaf where this view will be displayed
	 * @param plugin - The parent plugin instance
	 */
	constructor(leaf: WorkspaceLeaf, plugin: LifeCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
		// Refresh the view when a new file is created or deleted
		this.registerEvent(this.app.vault.on('create', this.onFileChange));
		this.registerEvent(this.app.vault.on('delete', this.onFileChange));

		if (
			this.plugin.settings.syncWithJournalNotes &&
			journalsPluginExists(this.app)
		) {
			const journals = getJournalsApi(this.app);
			if (journals) {
				// Register the cleanup so the listener is removed on view unload
				this.register(journals.on('noteAdded', this.onFileChange));
			}
		}
	}

	/**
	 * Event handler called when files are created or deleted in the vault.
	 * Triggers a refresh of all Life Calendar views to update weekly note indicators.
	 */
	onFileChange = (): void => refreshLifeCalendarView(this.app);

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
	override onOpen(): Promise<void> {
		return this.mountComponent();
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
	 * Retrieves weekly note settings from the Periodic Notes plugin if sync is enabled.
	 * @returns Periodic Notes plugin settings object or undefined if sync is disabled or plugin not found
	 */
	private getPeriodicNotesPluginSettings() {
		return this.plugin.settings.syncWithWeeklyNotes
			? periodicNotesPluginWeeklySettings(this.app)
			: undefined;
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

	private async buildComponentProps(): Promise<
		ComponentProps<typeof LifeCalendar>
	> {
		const birthdate = this.getBirthdateFromSettings();
		const projectedLifespan = this.getProjectedLifespanFromSettings();
		const calendarMode = this.getCalendarModeFromSettings();
		const modalFn = this.getModalFunction();

		let weekStartsOn =
			this.plugin.settings.weekStartDay ?? DEFAULT_SETTINGS.weekStartDay;
		let folderPath =
			this.plugin.settings.fileLocation ?? DEFAULT_SETTINGS.fileLocation;
		let fileNamePattern =
			this.plugin.settings.fileNamePattern ??
			DEFAULT_SETTINGS.fileNamePattern;
		let templatePath =
			this.plugin.settings.templatePath ?? DEFAULT_SETTINGS.templatePath;
		let allWeeklyNotes: Record<string, TFile> | undefined = undefined;

		const syncWithJournalNotes =
			this.plugin.settings.syncWithJournalNotes &&
			journalsPluginExists(this.app);

		if (syncWithJournalNotes) {
			const journals = getJournalsApi(this.app);
			if (journals) {
				const existing = await journals.existingNotes(
					{ writeType: 'week' },
					{
						from: birthdate,
						to: momentFn(birthdate, 'YYYY-MM-DD')
							.add(projectedLifespan, 'years')
							.format('YYYY-MM-DD'),
					},
				);

				// Can't get the week start day directly from the Journals API, but if
				// there are any existing weekly notes, we can infer the week start day
				// from the start date of an existing note.
				// If there are no existing weekly notes, then it largely has no effect
				// so we just use the week start day from the plugin settings.
				if (existing.length > 0 && existing[0]?.date) {
					const m = momentFn(existing[0].date, 'YYYY-MM-DD');
					const dayIndex = m.day();
					weekStartsOn =
						weekStartsOnIndexToString(dayIndex) || weekStartsOn;
				}

				const record: Record<string, TFile> = {};
				for (const note of existing) {
					const d = createLocalDateYYYYMMDD(note.date);
					record[dateToWeeklyNoteRecordKeyFormat(d)] = note.file;
				}
				allWeeklyNotes = record;
				console.log('allWeeklyNotes', allWeeklyNotes);
			}
		} else {
			const periodicNotesSettings = this.getPeriodicNotesPluginSettings();
			weekStartsOn = periodicNotesSettings?.weekStartDay ?? weekStartsOn;
			folderPath = periodicNotesSettings?.folderPath ?? folderPath;
			fileNamePattern =
				periodicNotesSettings?.fileNamePattern ?? fileNamePattern;
			templatePath = periodicNotesSettings?.templatePath ?? templatePath;

			allWeeklyNotes = this.getAllWeeklyNotesFromFolder(
				folderPath,
				fileNamePattern,
				weekStartsOn,
			);
		}

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
			syncWithJournalNotes,
			app: this.app,
		};
	}

	private async mountComponent(): Promise<void> {
		this.lifeCalendar = mount(LifeCalendar, {
			target: this.contentEl,
			props: await this.buildComponentProps(),
		});
	}

	/**
	 * Cleans up and destroys the Svelte component instance.
	 * Calls the Svelte $destroy method if available and clears the content element.
	 * This prevents memory leaks and ensures proper cleanup before remounting.
	 */
	private cleanupComponent(): void {
		if (this.lifeCalendar) {
			void unmount(this.lifeCalendar);
			this.lifeCalendar = undefined;
		}
		this.contentEl.empty();
	}

	/**
	 * Refreshes the view by cleaning up and remounting the component.
	 * Called when settings change or when weekly notes are created/deleted.
	 * This ensures the calendar reflects the latest state and configuration.
	 */
	async refreshView(): Promise<void> {
		// Cleanup properly before mounting new component
		this.cleanupComponent();
		await this.mountComponent();
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
