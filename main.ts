import { Plugin, WorkspaceLeaf } from 'obsidian';
import { LifeCalendarView } from 'src/view';
import { LifeCalendarSettingTab } from 'src/settingTab';
import {
	createLocalDateYYYYMMDD,
	dateToYYYYMMDD,
	weekStartsOnIndexToString,
} from 'src/lib/utils';
import {
	DEFAULT_SETTINGS,
	VIEW_TYPE_LIFE_CALENDAR,
} from 'src/lib/calendar-constants';
import type { IntegrationSettings, LifeCalendarSettings } from 'src/lib/types';

export default class LifeCalendarPlugin extends Plugin {
	settings!: LifeCalendarSettings;
	private statusBarItem: HTMLElement | null = null;
	private lastBirthdayCheck: string | null = null;

	override async onload() {
		try {
			await this.loadSettings();
		} catch (error) {
			console.error(
				'Failed to load plugin settings:',
				error instanceof Error ? error.message : error,
			);
			// Use default settings on error
			this.settings = { ...DEFAULT_SETTINGS };
		}

		// Add custom view https://docs.obsidian.md/Plugins/User+interface/Views
		this.registerView(
			VIEW_TYPE_LIFE_CALENDAR,
			(leaf) => new LifeCalendarView(leaf, this),
		);

		// Add icon to left ribbon to open the Life in Weeks Calendar view
		const ribbonIconEl = this.addRibbonIcon(
			'calendar-clock',
			'Open life in weeks calendar',
			async () => {
				await this.activateView();
			},
		);
		ribbonIconEl.addClass('life-in-weeks-calendar-ribbon-class');

		// Add a command to open the Life in Weeks Calendar view
		this.addCommand({
			id: 'open-calendar',
			name: 'Open calendar',
			callback: async () => {
				await this.activateView();
			},
		});

		// Check and show birthday message
		this.checkAndShowBirthday();

		// Add a settings tab
		this.addSettingTab(new LifeCalendarSettingTab(this.app, this));
	}

	/**
	 * Checks if the current day is the user's birthday and displays a message in the status bar if it is.
	 * This check is performed only once per day to avoid redundant processing.
	 * It also handles clearing the message on a new day.
	 */
	private checkAndShowBirthday(): void {
		const today = new Date();
		const todayString = dateToYYYYMMDD(today);

		// Skip if already checked today
		if (this.lastBirthdayCheck === todayString) return;

		// Update cache
		this.lastBirthdayCheck = todayString;

		// Clear any existing birthday status bar
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}

		// Check if today is birthday
		const birthDate = createLocalDateYYYYMMDD(this.settings.birthdate);
		if (
			birthDate.getDate() === today.getDate() &&
			birthDate.getMonth() === today.getMonth()
		) {
			this.statusBarItem = this.addStatusBarItem();
			this.statusBarItem.createEl('span', { text: 'Happy birthday 🎂' });
		}
	}

	override onunload() {
		// Clean up status bar item
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Iterates through all open Life Calendar views and triggers a refresh.
	 * This is typically called after settings have been changed to ensure the view
	 * reflects the latest configuration.
	 */
	refreshLifeCalendarView(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(
			VIEW_TYPE_LIFE_CALENDAR,
		)) {
			const view = leaf.view;
			if (view instanceof LifeCalendarView) {
				view.refreshView();
			}
		}
	}

	/**
	 * Retrieves the week start day setting from the 'Calendar' plugin.
	 * This is used for integration to determine the start of the week if not configured locally.
	 * Note: This relies on the internal structure of the 'Calendar' plugin and may break if that plugin changes.
	 * @returns The week start day as a string (e.g., 'monday'), or undefined if the 'Calendar' plugin is not installed or the setting is not available.
	 */
	getWeekStartsOnOptionFromCalendar(): string | undefined {
		// @ts-ignore
		const calendarPlugin = this.app.plugins.getPlugin('calendar');
		return calendarPlugin?.options?.weekStart;
	}

	/**
	 * Checks if the 'periodic-notes' plugin is installed and if its weekly notes feature is enabled.
	 * This is used for integration to determine if weekly note settings should be synced.
	 * Note: This relies on the internal structure of the 'periodic-notes' plugin.
	 * @returns `true` if the plugin is present and weekly notes are enabled, `false` otherwise.
	 */
	weeklyPeriodicNotesPluginExists(): boolean {
		// @ts-ignore
		const periodicNotes = this.app.plugins.getPlugin('periodic-notes');
		return periodicNotes && periodicNotes.settings?.weekly?.enabled;
	}

	/**
	 * Retrieves weekly note settings from the 'Journals' plugin if it's installed and configured.
	 * This is used for integration to help locate weekly notes.
	 *
	 * @returns An object with weekly settings if found, otherwise undefined.
	 * The returned object contains:
	 * - `weekStartDay`: The configured start day of the week (e.g., 'sunday', 'monday').
	 * - `fileNamePattern`: The date format pattern for weekly note file names.
	 * - `folderPath`: The folder where weekly notes are stored.
	 * - `templatePath`: The template file path for new weekly notes.
	 * Returns `undefined` if the 'Journals' plugin is not found or if no weekly settings are configured.
	 */
	journalPluginWeeklySettings(): IntegrationSettings | undefined {
		// @ts-ignore
		const journalsPlugin = this.app.plugins.getPlugin('journals');

		if (!journalsPlugin) {
			return undefined;
		}

		const weeksSettings = journalsPlugin.journals?.find(
			(j: any) => j?.type === 'week',
		);

		// Return undefined if no weekly journal configuration exists
		if (!weeksSettings) {
			return undefined;
		}

		const weekStartDay: number | undefined =
			journalsPlugin.calendarSettings?.dow;
		const fileNamePattern: string | undefined =
			weeksSettings.config?.value?.nameTemplate;
		const folderPath: string | undefined =
			weeksSettings.config?.value?.folder;
		const templatePath: string | undefined =
			weeksSettings.config?.value?.templates?.[0];
		const dateFormat = weeksSettings.config?.value?.dateFormat;

		// If the folder path contains {{journal_name}} the replace that with weekSettings.name
		// There are other template variables but this is the only one we can resolve here
		const resolvedFolderPath = folderPath
			? folderPath.replace(
					'{{journal_name}}',
					weeksSettings.name || 'Weekly',
				)
			: '';

		// Journals plugin has a default date format option. We can convert
		// {{date}} to {{date:FORMAT}} in folderPath and fileNamePattern now rather than
		// passing the default through the entire codebase.
		const dateFormatToken = dateFormat ? `:${dateFormat}` : '';
		const fileNamePatternWithDateFormat = fileNamePattern
			? fileNamePattern.replace('{{date}}', `{{date${dateFormatToken}}}`)
			: '';
		const folderPathWithDateFormat = resolvedFolderPath
			? resolvedFolderPath.replace(
					'{{date}}',
					`{{date${dateFormatToken}}}`,
				)
			: '';

		return {
			weekStartDay: weekStartsOnIndexToString(weekStartDay) || '',
			fileNamePattern: fileNamePatternWithDateFormat || '',
			folderPath: folderPathWithDateFormat || '',
			templatePath: templatePath || '',
			dateFormat: dateFormat || '',
		};
	}

	/**
   * Retrieves weekly note settings from the 'Periodic Notes' plugin if it's installed and 
  configured.
   * This is used for integration to help locate weekly notes.
   *
   * @returns An object with weekly settings if found, otherwise undefined.
   * The returned object contains:
   * - `fileNamePattern`: The date format pattern for weekly note file names.
   * - `folderPath`: The folder where weekly notes are stored.
   * - `templatePath`: The template file path for new weekly notes.
   * Returns `undefined` if the 'Periodic Notes' plugin is not found or if weekly notes are
   not enabled.
   */
	periodicNotesPluginWeeklySettings():
		| Omit<IntegrationSettings, 'weekStartDay' | 'dateFormat'>
		| undefined {
		const periodicNotesSettings =
			// @ts-ignore
			this.app.plugins.getPlugin('periodic-notes');

		if (!periodicNotesSettings) {
			return undefined;
		}

		const weeklySettings = periodicNotesSettings.settings?.weekly;
		if (!weeklySettings?.enabled) {
			return undefined;
		}
		return {
			fileNamePattern: weeklySettings.format || '',
			folderPath: weeklySettings.folder || '',
			templatePath: weeklySettings.template || '',
		};
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_LIFE_CALENDAR);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			const preferredLocation = this.settings.viewLocation;
			leaf =
				preferredLocation === 'right'
					? workspace.getRightLeaf(false)
					: preferredLocation === 'left'
						? workspace.getLeftLeaf(false)
						: workspace.getLeaf(false);
			await leaf!.setViewState({
				type: VIEW_TYPE_LIFE_CALENDAR,
				active: true,
			});
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		await workspace.revealLeaf(leaf!);
	}
}
