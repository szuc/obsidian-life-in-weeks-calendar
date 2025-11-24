import LifeCalendarPlugin from 'main';
import { App, PluginSettingTab, Setting } from 'obsidian';
import { CALENDAR_VALIDATION } from 'src/lib/calendar-constants';
import { dateToYYYYMMDD, isValidDate } from 'src/lib/utils';
import { FolderSuggest, FileSuggest } from './FileAndFolderSuggest';

/**
 * Settings tab for the Life Calendar plugin.
 */
export class LifeCalendarSettingTab extends PluginSettingTab {
	plugin: LifeCalendarPlugin;

	constructor(app: App, plugin: LifeCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Validates that a lifespan value is a valid integer within the allowed range.
	 * @param value - The lifespan value to validate
	 * @returns `true` if the value is a valid integer between MIN_LIFESPAN and MAX_LIFESPAN, `false` otherwise
	 */
	private isValidLifespan(value: string): boolean {
		const lifespan = Number(value);
		return (
			!isNaN(lifespan) &&
			Number.isInteger(lifespan) &&
			lifespan >= CALENDAR_VALIDATION.MIN_LIFESPAN &&
			lifespan <= CALENDAR_VALIDATION.MAX_LIFESPAN
		);
	}

	/**
	 * Tests for filesystem characters that are unsafe across Windows, macOS, and Linux.
	 * @param value - The string to test for unsafe characters
	 * @returns `true` if the value contains unsafe filesystem characters, `false` otherwise
	 */
	private containsUnsafeCharacters(value: string): boolean {
		const unsafeCharacters = /[<>:"|?*\\]/;
		return unsafeCharacters.test(value);
	}

	/**
	 * Validates that a file naming pattern contains only safe characters and has balanced brackets.
	 * @param pattern - The Moment.js date format pattern to validate
	 * @returns `true` if the pattern is valid (safe characters and balanced brackets), `false` otherwise
	 */
	private isValidFileNamePattern(pattern: string): boolean {
		// Empty pattern is valid (falls back to default)
		if (pattern === '') return true;

		// Check for filesystem-unsafe characters
		if (this.containsUnsafeCharacters(pattern)) return false;

		// Check for balanced square brackets
		let bracketDepth = 0;
		for (const char of pattern) {
			if (char === '[') bracketDepth++;
			if (char === ']') bracketDepth--;
			if (bracketDepth < 0) return false; // Closing before opening
		}
		if (bracketDepth !== 0) return false; // Unmatched brackets

		return true;
	}

	/**
	 * Validates that a path contains only safe characters and no relative path markers.
	 * @param path - The path to validate
	 * @returns `true` if the path is valid (safe characters, no relative paths), `false` otherwise
	 */
	private isValidPath(path: string): boolean {
		path = path.trim();
		// Empty path is valid (vault root)
		if (path === '') return true;

		// Check for filesystem-unsafe characters (allow / for folder separators)
		if (this.containsUnsafeCharacters(path)) return false;

		// Check for consecutive slashes
		if (path.includes('//')) return false;

		// Check for relative path markers
		if (path.includes('..') || path === '.' || path.includes('/.')) {
			return false;
		}

		return true;
	}

	/**
	 * Validates that a file path is valid and ends with '.md'.
	 * @param path - The file path to validate
	 * @returns `true` if the file path is valid and ends with '.md', `false` otherwise
	 */
	private isValidFileName(path: string): boolean {
		return this.isValidPath(path) && path.endsWith('.md');
	}

	/**
	 * Normalizes a folder path by trimming whitespace and removing leading/trailing slashes.
	 * @param path - The folder path to normalize
	 * @returns The normalized path without leading/trailing slashes
	 */
	private normalizeFolderPath(path: string): string {
		// Trim whitespace
		path = path.trim();

		// Strip leading and trailing slashes
		path = path.replace(/^\/+|\/+$/g, '');

		return path;
	}

	/**
	 * Checks if weekly note settings are overridden by either the Periodic Notes or Journals plugin.
	 * Uses helper methods to determine if either plugin integration is currently active.
	 * @returns `true` if settings are being synced from either plugin, `false` otherwise.
	 */
	private isOverriddenByOtherPlugin(): boolean {
		return (
			this.syncWithWeeklyNotesIsEnabled() ||
			this.syncWithJournalNotesIsEnabled()
		);
	}

	/**
	 * Checks if syncing with the Periodic Notes plugin is enabled.
	 * @returns `true` if the Periodic Notes plugin exists and sync is enabled, `false` otherwise.
	 */
	private syncWithWeeklyNotesIsEnabled(): boolean {
		return (
			this.plugin.weeklyPeriodicNotesPluginExists() &&
			this.plugin.settings.syncWithWeeklyNotes
		);
	}

	/**
	 * Checks if syncing with the Journals plugin is enabled.
	 * @returns `true` if the Journals plugin exists and sync is enabled, `false` otherwise.
	 */
	private syncWithJournalNotesIsEnabled(): boolean {
		return (
			!!this.plugin.journalPluginWeeklySettings() &&
			this.plugin.settings.syncWithJournalNotes
		);
	}

	/**
	 * Creates an error message element for the settings UI.
	 * Removes any existing error with the same ID before creating a new one.
	 * @param id - Unique identifier for the error element
	 * @param message - Error message text to display
	 * @returns The created error message HTMLElement
	 */
	private createErrorMessageElement(
		id: string,
		message: string,
	): HTMLElement {
		const existingError = document.getElementById(id);
		if (existingError) {
			existingError.remove();
		}
		const errorEl = document.createElement('div');
		errorEl.textContent = message;
		errorEl.id = id;
		errorEl.className = 'lwc__error-message--setting';
		return errorEl;
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
							const errorEl = this.createErrorMessageElement(
								'setting-birthdate-error',
								'Please enter a valid date.',
							);
							text.inputEl.parentElement?.appendChild(errorEl);
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
					const invalidLifespan = !this.isValidLifespan(value);
					if (invalidLifespan) {
						const errorEl = this.createErrorMessageElement(
							'setting-lifespan-error',
							'Please enter a valid number.',
						);
						text.inputEl.parentElement?.appendChild(errorEl);
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
		// Setting to sync with the Journals plugin.
		// The name and description change if the Journals plugin is not detected.
		// It is disabled if syncing with Periodic Notes is enabled.
		new Setting(containerEl)
			.setName(
				this.syncWithWeeklyNotesIsEnabled()
					? 'Disabled: Use journals plugin settings'
					: !!this.plugin.journalPluginWeeklySettings()
						? 'Use journals plugin settings'
						: 'Journals weekly notes not enabled ⚠️',
			)
			.setDesc(
				this.syncWithWeeklyNotesIsEnabled()
					? 'Using periodic notes plugin settings.'
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
							!this.plugin.journalPluginWeeklySettings(),
					),
			);

		// Setting to sync with the Periodic Notes plugin.
		// The name and description change if the Periodic Notes plugin is not detected.
		// It is disabled if syncing with Journals is enabled.
		new Setting(containerEl)
			.setName(
				this.syncWithJournalNotesIsEnabled()
					? 'Disabled: Use periodic notes plugin settings'
					: this.plugin.weeklyPeriodicNotesPluginExists()
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
							!this.plugin.weeklyPeriodicNotesPluginExists(),
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
					: 'Folder path where weekly notes are stored. Leave blank for root directory.',
			)
			.addSearch((search) => {
				search
					.setPlaceholder(
						'E.g. weekly-notes or periodic-notes/weekly',
					)
					.setValue(this.plugin.settings.fileLocation);

				// Validate and save on blur
				search.inputEl.addEventListener('blur', async () => {
					const value = search.inputEl.value;
					this.plugin.settings.fileLocation = value;
					const normalized = this.normalizeFolderPath(value);
					const invalidPath = !this.isValidPath(normalized);

					if (invalidPath) {
						const errorEl = this.createErrorMessageElement(
							'setting-filepath-error',
							'Please enter a valid folder path.',
						);
						search.inputEl.parentElement?.appendChild(errorEl);
						return;
					} else {
						const existingError = document.getElementById(
							'setting-filepath-error',
						);
						if (existingError) {
							existingError.remove();
						}

						// Update input to show normalized path
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
					: 'Enter a moment.js date format or leave blank for default gggg-[W]ww.',
			)
			.addText((text) => {
				text.inputEl.type = 'text';
				text.inputEl.placeholder = 'E.g. gggg-[W]ww';
				text.inputEl.disabled = this.isOverriddenByOtherPlugin();
				text.setValue(this.plugin.settings.fileNamePattern || '');

				// Validate and save on blur
				text.inputEl.addEventListener('blur', async () => {
					const value = text.inputEl.value;
					const invalidPattern = !this.isValidFileNamePattern(
						value.trim(),
					);

					if (invalidPattern) {
						const errorEl = this.createErrorMessageElement(
							'setting-filename-error',
							'Please enter a valid file naming pattern.',
						);
						text.inputEl.parentElement?.appendChild(errorEl);
						return;
					} else {
						const existingError = document.getElementById(
							'setting-filename-error',
						);
						if (existingError) {
							existingError.remove();
						}
						this.plugin.settings.fileNamePattern = value;
						try {
							await this.plugin.saveSettings();
							this.plugin.refreshLifeCalendarView();
						} catch (error) {
							console.error(
								'Failed to save fileNamePattern setting:',
								error instanceof Error ? error.message : error,
							);
						}
					}
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
					const invalidPattern = !this.isValidFileName(value.trim());

					if (invalidPattern) {
						const errorEl = this.createErrorMessageElement(
							'setting-templatePath-error',
							'Please enter a valid template file.',
						);
						search.inputEl.parentElement?.appendChild(errorEl);
						return;
					} else {
						const existingError = document.getElementById(
							'setting-templatePath-error',
						);
						if (existingError) {
							existingError.remove();
						}
						this.plugin.settings.templatePath = value;
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
	 */
	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		this.addBirthdateSetting(containerEl);
		this.addLifespanSetting(containerEl);
		this.addCalendarModeSetting(containerEl);
		this.addViewLocationSetting(containerEl);
		this.addPluginIntegrationSettings(containerEl);
		this.addWeeklyNoteSettings(containerEl);
		this.addConfirmationSetting(containerEl);
	}
}
