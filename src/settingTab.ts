import LifeCalendarPlugin from 'main';
import { App, normalizePath, PluginSettingTab, Setting } from 'obsidian';
import { CALENDAR_VALIDATION } from 'src/lib/calendar-constants';
import {
	dateToYYYYMMDD,
	isValidDate,
	isValidLifespan,
	isValidFileName,
	isStringDynamic,
} from 'src/lib/utils';
import { FolderSuggest, FileSuggest } from './FileAndFolderSuggest';

/**
 * Settings tab for the Life Calendar plugin.
 */
export class LifeCalendarSettingTab extends PluginSettingTab {
	plugin: LifeCalendarPlugin;

	/** Cache for plugin state to avoid repeated lookups during settings render */
	private _cachedWeeklyPeriodicNotesExists: boolean | undefined;
	private _cachedJournalPluginSettings?: ReturnType<
		typeof LifeCalendarPlugin.prototype.journalPluginWeeklySettings
	>;
	private _cachedSyncWithWeeklyNotes: boolean | undefined;
	private _cachedSyncWithJournalNotes: boolean | undefined;
	private _cachedIsOverridden: boolean | undefined;

	constructor(app: App, plugin: LifeCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Computes and caches plugin state values to avoid repeated lookups during settings render.
	 * Should be called once at the start of display() and cleared after rendering completes.
	 */
	private computeSettingsCache(): void {
		// Cache plugin existence checks (these involve plugin lookups)
		this._cachedWeeklyPeriodicNotesExists =
			this.plugin.weeklyPeriodicNotesPluginExists();
		this._cachedJournalPluginSettings =
			this.plugin.journalPluginWeeklySettings();

		// Cache computed sync states
		this._cachedSyncWithWeeklyNotes =
			this._cachedWeeklyPeriodicNotesExists &&
			this.plugin.settings.syncWithWeeklyNotes;
		this._cachedSyncWithJournalNotes =
			!!this._cachedJournalPluginSettings &&
			this.plugin.settings.syncWithJournalNotes;

		// Cache the override state
		this._cachedIsOverridden =
			this._cachedSyncWithWeeklyNotes || this._cachedSyncWithJournalNotes;
	}

	/**
	 * Clears the cached settings values.
	 * Should be called after display() completes to free memory.
	 */
	private clearSettingsCache(): void {
		this._cachedWeeklyPeriodicNotesExists = undefined;
		this._cachedJournalPluginSettings = undefined;
		this._cachedSyncWithWeeklyNotes = undefined;
		this._cachedSyncWithJournalNotes = undefined;
		this._cachedIsOverridden = undefined;
	}

	/**
	 * Checks if weekly note settings are overridden by either the Periodic Notes or Journals plugin.
	 * Uses helper methods to determine if either plugin integration is currently active.
	 * Uses cached values during settings render to avoid repeated plugin lookups.
	 * @returns `true` if settings are being synced from either plugin, `false` otherwise.
	 */
	private isOverriddenByOtherPlugin(): boolean {
		// Use cached value if available (during display render)
		if (this._cachedIsOverridden !== undefined) {
			return this._cachedIsOverridden;
		}
		// Fallback to computed value (e.g., if called outside display())
		return (
			this.syncWithWeeklyNotesIsEnabled() ||
			this.syncWithJournalNotesIsEnabled()
		);
	}

	/**
	 * Checks if syncing with the Periodic Notes plugin is enabled.
	 * Uses cached values during settings render to avoid repeated plugin lookups.
	 * @returns `true` if the Periodic Notes plugin exists and sync is enabled, `false` otherwise.
	 */
	private syncWithWeeklyNotesIsEnabled(): boolean {
		// Use cached value if available (during display render)
		if (this._cachedSyncWithWeeklyNotes !== undefined) {
			return this._cachedSyncWithWeeklyNotes;
		}
		// Fallback to computed value (e.g., if called outside display())
		return (
			this.plugin.weeklyPeriodicNotesPluginExists() &&
			this.plugin.settings.syncWithWeeklyNotes
		);
	}

	/**
	 * Checks if syncing with the Journals plugin is enabled.
	 * Uses cached values during settings render to avoid repeated plugin lookups.
	 * @returns `true` if the Journals plugin exists and sync is enabled, `false` otherwise.
	 */
	private syncWithJournalNotesIsEnabled(): boolean {
		// Use cached value if available (during display render)
		if (this._cachedSyncWithJournalNotes !== undefined) {
			return this._cachedSyncWithJournalNotes;
		}
		// Fallback to computed value (e.g., if called outside display())
		return (
			!!this.plugin.journalPluginWeeklySettings() &&
			this.plugin.settings.syncWithJournalNotes
		);
	}

	/**
	 * Creates an error message element for the settings UI.
	 * Removes any existing error with the same ID before creating a new one.
	 * Uses Obsidian's createDiv method for proper cleanup.
	 * @param parent - Parent element to append the error to
	 * @param id - Unique identifier for the error element
	 * @param message - Error message text to display
	 */
	private createErrorMessageElement(
		parent: HTMLElement,
		id: string,
		message: string,
	): void {
		const existingError = document.getElementById(id);
		if (existingError) {
			existingError.remove();
		}
		parent.createDiv({
			cls: 'lwc__error-message--setting',
			text: message,
			attr: { id },
		});
	}

	/**
	 * Adds the birthdate setting to the settings UI.
	 * Provides a date input with validation and persists changes to plugin settings.
	 * @param containerEl - The HTML element to append the setting to
	 */
	addBirthdateSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Birth date')
			.setDesc('Your date of birth')
			.addText((text) => {
				text.inputEl.type = 'date';
				text.inputEl.min = CALENDAR_VALIDATION.MIN_YEAR + '-01-01';
				text.inputEl.max = dateToYYYYMMDD(new Date()) /* today */;
				text.setValue(this.plugin.settings.birthdate).onChange(
					async (value) => {
						if (!value || !isValidDate(new Date(value))) {
							if (text.inputEl.parentElement) {
								this.createErrorMessageElement(
									text.inputEl.parentElement,
									'setting-birthdate-error',
									'Please enter a valid date.',
								);
							}
							return;
						} else {
							const existingError = document.getElementById(
								'setting-birthdate-error',
							);
							if (existingError) {
								existingError.remove();
							}
							this.plugin.settings.birthdate = value;
							try {
								await this.plugin.saveSettings();
								this.plugin.refreshLifeCalendarView();
							} catch (error) {
								console.error(
									'Failed to save birthdate setting:',
									error instanceof Error
										? error.message
										: error,
								);
							}
						}
					},
				);
			});
	}

	/**
	 * Adds the projected lifespan setting to the settings UI.
	 * Provides a number input with validation for values between 1 and 200 years.
	 * @param containerEl - The HTML element to append the setting to
	 */
	addLifespanSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Projected lifespan (years)')
			.setDesc('How many years you expect to live (1 to 200)')
			.addText((text) => {
				text.inputEl.type = 'number';
				text.inputEl.min = CALENDAR_VALIDATION.MIN_LIFESPAN.toString();
				text.inputEl.max = CALENDAR_VALIDATION.MAX_LIFESPAN.toString();
				text.setValue(
					this.plugin.settings.projectedLifespan.toString(),
				).onChange(async (value) => {
					const invalidLifespan = !isValidLifespan(
						value,
						CALENDAR_VALIDATION.MIN_LIFESPAN,
						CALENDAR_VALIDATION.MAX_LIFESPAN,
					);
					if (invalidLifespan) {
						if (text.inputEl.parentElement) {
							this.createErrorMessageElement(
								text.inputEl.parentElement,
								'setting-lifespan-error',
								'Please enter a valid number.',
							);
						}
						return;
					} else {
						const existingError = document.getElementById(
							'setting-lifespan-error',
						);
						if (existingError) {
							existingError.remove();
						}
						this.plugin.settings.projectedLifespan = value;
						try {
							await this.plugin.saveSettings();
							this.plugin.refreshLifeCalendarView();
						} catch (error) {
							console.error(
								'Failed to save lifespan setting:',
								error instanceof Error ? error.message : error,
							);
						}
					}
				});
			});
	}

	/**
	 * Adds the calendar view mode setting to the settings UI.
	 * Allows users to choose between 'Standard' and 'Decades' view modes.
	 * @param containerEl - The HTML element to append the setting to
	 */
	addCalendarModeSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Calendar view mode')
			.setDesc('Standard mode is better for sidebar or mobile views.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('basic', 'Standard')
					.addOption('yearly', 'Decades')
					.setValue(this.plugin.settings.calendarMode)
					.onChange(async (value) => {
						this.plugin.settings.calendarMode = value;
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
					}),
			);
	}

	/**
	 * Adds the view location setting to the settings UI.
	 * Allows users to choose where the calendar view appears (main, left sidebar, or right sidebar).
	 * @param containerEl - The HTML element to append the setting to
	 */
	addViewLocationSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('View location')
			.setDesc(
				'Close any existing views for location changes to take effect.',
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('main', 'Main')
					.addOption('left', 'Left sidebar')
					.addOption('right', 'Right sidebar')
					.setValue(this.plugin.settings.viewLocation)
					.onChange(async (value) => {
						this.plugin.settings.viewLocation = value;
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
					}),
			);
	}

	/**
	 * Adds plugin integration settings to the settings UI.
	 * Includes toggles for syncing with the Journals and Periodic Notes plugins.
	 * These settings are mutually exclusive - enabling one disables the other.
	 * @param containerEl - The HTML element to append the settings to
	 */
	addPluginIntegrationSettings(containerEl: HTMLElement): void {
		console.debug(
			'_cachedJournalPluginSettings',
			this._cachedJournalPluginSettings,
		);
		const isUsingDynamicFolderPath =
			this.syncWithJournalNotesIsEnabled() &&
			isStringDynamic(
				this._cachedJournalPluginSettings?.folderPath || '',
			);
		const isUsingDynamicFileNamePattern =
			this.syncWithJournalNotesIsEnabled() &&
			isStringDynamic(
				this._cachedJournalPluginSettings?.fileNamePattern || '',
			);
		// Setting to sync with the Journals plugin.
		// The name and description change if the Journals plugin is not detected.
		// It is disabled if syncing with Periodic Notes is enabled.
		new Setting(containerEl)
			.setName(
				this.syncWithWeeklyNotesIsEnabled()
					? 'Disabled: Use journals plugin settings'
					: !!this._cachedJournalPluginSettings
						? 'Use journals plugin settings'
						: 'Journals weekly notes not enabled ⚠️',
			)
			.setDesc(
				this.syncWithWeeklyNotesIsEnabled()
					? 'Using periodic notes plugin settings.'
					: isUsingDynamicFolderPath || isUsingDynamicFileNamePattern
						? `⚠️ Warning: Your journals plugin weekly note folder or filename pattern contains dynamic segments. 
						Some Journals custom variables are not supported e.g. {{note_name}}, {{title}}, {{time}}
						— use at your own risk.`
						: 'Optional: sync with journals plugin weekly note settings – filename, location, first day of week, templates.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.syncWithJournalNotesIsEnabled())
					.onChange(async (value) => {
						this.plugin.settings.syncWithJournalNotes = value;
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
						this.display(); // Re-render settings to update disabled states on other settings
					})
					.setDisabled(
						this.syncWithWeeklyNotesIsEnabled() ||
							!this._cachedJournalPluginSettings,
					),
			);

		// Setting to sync with the Periodic Notes plugin.
		// The name and description change if the Periodic Notes plugin is not detected.
		// It is disabled if syncing with Journals is enabled.
		new Setting(containerEl)
			.setName(
				this.syncWithJournalNotesIsEnabled()
					? 'Disabled: Use periodic notes plugin settings'
					: this._cachedWeeklyPeriodicNotesExists
						? 'Use periodic notes plugin settings'
						: 'Periodic weekly notes not enabled ⚠️',
			)
			.setDesc(
				this.syncWithJournalNotesIsEnabled()
					? 'Using journals plugin settings.'
					: 'Optional: sync with periodic notes plugin weekly note settings – filename, location, first day of week, templates.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.syncWithWeeklyNotesIsEnabled())
					.onChange(async (value) => {
						this.plugin.settings.syncWithWeeklyNotes = value;
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
						this.display(); // Re-render settings to update disabled states on other settings
					})
					.setDisabled(
						this.syncWithJournalNotesIsEnabled() ||
							!this._cachedWeeklyPeriodicNotesExists,
					),
			);
	}
	/**
	 * Adds weekly note configuration settings to the settings UI.
	 * Includes settings for folder location, file naming pattern, week start day, and template file.
	 * These settings are disabled when syncing with Journals or Periodic Notes plugins.
	 * @param containerEl - The HTML element to append the settings to
	 */
	addWeeklyNoteSettings(containerEl: HTMLElement): void {
		// Setting for weekly note folder location.
		// This setting is disabled if syncing with Journals or Periodic Notes is enabled.
		new Setting(containerEl)
			.setName(
				`${this.isOverriddenByOtherPlugin() ? 'Disabled: ' : ''}Weekly note folder location`,
			)
			.setDesc(
				this.isOverriddenByOtherPlugin()
					? 'Using settings from another plugin.'
					: `Path to your weekly notes folder. Use forward slash / for vault root.
					You can use dynamic segments in sub-folders in the format {{date:moment_syntax}}
					e.g. weekly-notes/{{date:YYYY}}/{{date:MM}}.`,
			)
			.addSearch((search) => {
				search
					.setPlaceholder('E.g. weekly-notes or notes/weekly')
					.setValue(this.plugin.settings.fileLocation);

				// Normalize and save on blur
				search.inputEl.addEventListener('blur', async () => {
					const value = search.inputEl.value;

					const normalized = normalizePath(value);
					search.inputEl.value = normalized;
					this.plugin.settings.fileLocation = normalized;

					try {
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
					} catch (error) {
						console.error(
							'Failed to save fileLocation setting:',
							error instanceof Error ? error.message : error,
						);
					}
				});

				// Attaches custom suggestions
				new FolderSuggest(this.app, search.inputEl);
			});

		// Setting for weekly note file naming pattern.
		// This setting is disabled if syncing with Journals or Periodic Notes is enabled.
		new Setting(containerEl)
			.setName(
				`${this.isOverriddenByOtherPlugin() ? 'Disabled: ' : ''}Weekly note file naming pattern`,
			)
			.setDesc(
				this.isOverriddenByOtherPlugin()
					? 'Using settings from another plugin.'
					: `Enter a moment.js date format or leave blank for default gggg-[W]ww. 
					Filenames must resolve to uniquely identifiable weeks.`,
			)
			.addText((text) => {
				text.inputEl.type = 'text';
				text.inputEl.placeholder = 'E.g. gggg-[W]ww';
				text.inputEl.disabled = this.isOverriddenByOtherPlugin();
				text.setValue(this.plugin.settings.fileNamePattern || '');

				// Validate and save on blur
				text.inputEl.addEventListener('blur', async () => {
					const value = text.inputEl.value;
					const normalized = normalizePath(value);
					this.plugin.settings.fileNamePattern = normalized;
					try {
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
					} catch (error) {
						console.error(
							'Failed to save fileNamePattern setting:',
							error instanceof Error ? error.message : error,
						);
					}
					// }
				});
			});

		// Setting for the first day of the week.
		// This setting is disabled if syncing with Journals or Periodic Notes is enabled.
		new Setting(containerEl)
			.setName(
				`${this.isOverriddenByOtherPlugin() ? 'Disabled: ' : ''}First day of the week`,
			)
			.setDesc(
				this.isOverriddenByOtherPlugin()
					? 'Using settings from another plugin.'
					: 'Select the day that weekly notes start on.',
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('monday', 'Monday')
					.addOption('tuesday', 'Tuesday')
					.addOption('wednesday', 'Wednesday')
					.addOption('thursday', 'Thursday')
					.addOption('friday', 'Friday')
					.addOption('saturday', 'Saturday')
					.addOption('sunday', 'Sunday')
					.setDisabled(this.isOverriddenByOtherPlugin())
					.setValue(this.plugin.settings.weekStartDay || 'monday')
					.onChange(async (value) => {
						this.plugin.settings.weekStartDay = value;
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
					}),
			);

		// Setting for the weekly note template file.
		// This setting is disabled if syncing with Journals or Periodic Notes is enabled.
		new Setting(containerEl)
			.setName(
				`${this.isOverriddenByOtherPlugin() ? 'Disabled: ' : ''}Weekly note template`,
			)
			.setDesc(
				this.isOverriddenByOtherPlugin()
					? 'Using settings from another plugin.'
					: 'Optional template file for new weekly notes. Leave blank for no template.',
			)
			.addSearch((search) => {
				search
					.setPlaceholder('E.g. templates/weekly-note.md')
					.setValue(this.plugin.settings.templatePath);

				// Validate and save on blur
				search.inputEl.addEventListener('blur', async () => {
					const value = search.inputEl.value;
					const normalized = normalizePath(value);
					search.inputEl.value = normalized;

					const invalidPattern = !isValidFileName(normalized);

					if (invalidPattern) {
						if (search.inputEl.parentElement) {
							this.createErrorMessageElement(
								search.inputEl.parentElement,
								'setting-templatePath-error',
								'Please enter a valid template file.',
							);
						}
						return;
					} else {
						const existingError = document.getElementById(
							'setting-templatePath-error',
						);
						if (existingError) {
							existingError.remove();
						}
						this.plugin.settings.templatePath = value.trim();
						try {
							await this.plugin.saveSettings();
							this.plugin.refreshLifeCalendarView();
						} catch (error) {
							console.error(
								'Failed to save templatePath setting:',
								error instanceof Error ? error.message : error,
							);
						}
					}
				});

				// Attaches custom suggestions
				new FileSuggest(this.app, search.inputEl);
			});
	}
	/**
	 * Adds the confirmation setting for creating weekly notes to the settings UI.
	 * Allows users to toggle whether they want a confirmation modal before creating new notes.
	 * @param containerEl - The HTML element to append the setting to
	 */
	addConfirmationSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Confirm before creating weekly note')
			.setDesc('Require confirmation before creating a new weekly note.')
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.confirmBeforeCreatingWeeklyNote,
					)
					.onChange(async (value) => {
						this.plugin.settings.confirmBeforeCreatingWeeklyNote =
							value;
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
					}),
			);
	}

	/**
	 * Renders the settings UI with all configuration options.
	 * Clears the container and builds all settings sections in order.
	 * Caches plugin state at the start to avoid repeated lookups during render.
	 */
	display(): void {
		const { containerEl } = this;

		// Compute cache once before rendering to avoid repeated plugin lookups
		this.computeSettingsCache();

		containerEl.empty();

		this.addBirthdateSetting(containerEl);
		this.addLifespanSetting(containerEl);
		this.addCalendarModeSetting(containerEl);
		this.addViewLocationSetting(containerEl);
		this.addPluginIntegrationSettings(containerEl);
		this.addWeeklyNoteSettings(containerEl);
		this.addConfirmationSetting(containerEl);

		// Clear cache after rendering to free memory
		this.clearSettingsCache();
	}
}
