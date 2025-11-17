import LifeCalendarPlugin from 'main';
import { App, PluginSettingTab, Setting } from 'obsidian';
import { CALENDAR_VALIDATION } from 'src/lib/calendar-constants';
import { dateToYYYYMMDD, isValidDate } from 'src/lib/utils';
import { FileSuggest } from './FileSuggest';
import { FolderSuggest } from './FolderSuggest';

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
	 * Validates that a file naming pattern contains only safe characters and has balanced brackets.
	 */
	private isValidFileNamingPattern(pattern: string): boolean {
		// Empty pattern is valid (falls back to default)
		if (pattern === '') return true;

		// Check for filesystem-unsafe characters
		const unsafeChars = /[<>:"|?*\/\\]/;
		if (unsafeChars.test(pattern)) return false;

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
	 * Validates that a folder path contains only safe characters and no relative path markers.
	 */
	private isValidFolderPath(path: string): boolean {
		path = path.trim();
		// Empty path is valid (vault root)
		if (path === '') return true;

		// Check for filesystem-unsafe characters (allow / for folder separators)
		const unsafeChars = /[<>:"|?*\\]/;
		if (unsafeChars.test(path)) return false;

		// Check for consecutive slashes
		if (path.includes('//')) return false;

		// Check for relative path markers
		if (path.includes('..') || path === '.' || path.includes('/.')) {
			return false;
		}

		return true;
	}

	/**
	 * Normalizes a folder path by trimming whitespace and removing leading/trailing slashes.
	 */
	private normalizeFolderPath(path: string): string {
		// Trim whitespace
		path = path.trim();

		// Strip leading and trailing slashes
		path = path.replace(/^\/+|\/+$/g, '');

		return path;
	}

	/**
	 * Checks if weekly note settings are overridden by the periodic notes plugin.
	 */
	private isOverriddenByPeriodicNotes(): boolean {
		return (
			this.plugin.weeklyPeriodicNotesPluginExists() &&
			this.plugin.settings.syncWithWeeklyNotes
		);
	}

	/**
	 * Creates an error message element for the settings UI.
	 * Removes any existing error with the same ID.
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
	 * Renders the settings UI with all configuration options.
	 */
	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('p', {
			text: 'Note: settings related to weekly note integrations might require closing the weekly calendar and reopening it for changes to take effect.',
		});

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

		new Setting(containerEl)
			.setName('Projected lifespan (years)')
			.setDesc('Your projected lifespan in years (1 to 200)')
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

		new Setting(containerEl)
			.setName(
				!this.plugin.weeklyPeriodicNotesPluginExists()
					? 'Weekly notes not enabled ⚠️'
					: 'Use periodic notes plugin',
			)
			.setDesc(
				'Optional: sync with periodic notes plugin settings – filename, location, first day of week, etc.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.weeklyPeriodicNotesPluginExists() &&
							this.plugin.settings.syncWithWeeklyNotes,
					)
					.onChange(async (value) => {
						this.plugin.settings.syncWithWeeklyNotes = value;
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
						this.display(); // Re-render settings to update disabled states on other settings
					})
					.setDisabled(
						!this.plugin.weeklyPeriodicNotesPluginExists(),
					),
			);

		new Setting(containerEl)
			.setName(
				`${this.isOverriddenByPeriodicNotes() ? 'Disabled: ' : ''}Weekly note file naming pattern`,
			)
			.setDesc(
				this.isOverriddenByPeriodicNotes()
					? 'Using settings from periodic notes plugin.'
					: 'Enter a moment.js date format or leave blank for default gggg-[W]ww.',
			)
			.addText((text) => {
				text.inputEl.type = 'text';
				text.inputEl.placeholder = 'e.g. gggg-[W]ww';
				text.inputEl.disabled = this.isOverriddenByPeriodicNotes();
				text.setValue(this.plugin.settings.fileNamingPattern || '');

				// Validate and save on blur
				text.inputEl.addEventListener('blur', async () => {
					const value = text.inputEl.value;
					const invalidPattern = !this.isValidFileNamingPattern(
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
						this.plugin.settings.fileNamingPattern = value;
						try {
							await this.plugin.saveSettings();
							this.plugin.refreshLifeCalendarView();
						} catch (error) {
							console.error(
								'Failed to save fileNamingPattern setting:',
								error instanceof Error ? error.message : error,
							);
						}
					}
				});
			});

		new Setting(containerEl)
			.setName(
				`${this.isOverriddenByPeriodicNotes() ? 'Disabled: ' : ''}Weekly note folder location`,
			)
			.setDesc(
				this.isOverriddenByPeriodicNotes()
					? 'Using settings from periodic notes plugin.'
					: 'Folder path where weekly notes are stored. Leave blank for root directory.',
			)
			.addSearch((search) => {
				search
					.setPlaceholder(
						'e.g. weekly-notes or periodic-notes/weekly',
					)
					.setValue(this.plugin.settings.fileLocation)
					.onChange(async (value) => {
						this.plugin.settings.fileLocation = value;
						const normalized = this.normalizeFolderPath(value);
						const invalidPath = !this.isValidFolderPath(normalized);

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
									error instanceof Error
										? error.message
										: error,
								);
							}
						}
					});

				// Attaches custom suggestions
				new FolderSuggest(this.app, search.inputEl);
			});

		new Setting(containerEl)
			.setName(
				`${this.isOverriddenByPeriodicNotes() ? 'Disabled: ' : ''}Weekly note start day of week`,
			)
			.setDesc(
				this.isOverriddenByPeriodicNotes()
					? 'Using settings from periodic notes plugin.'
					: 'Close the day that weeks start on.',
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
					.setDisabled(this.isOverriddenByPeriodicNotes())
					.setValue(this.plugin.settings.weekStartDay || 'monday')
					.onChange(async (value) => {
						this.plugin.settings.weekStartDay = value;
						await this.plugin.saveSettings();
						this.plugin.refreshLifeCalendarView();
					}),
			);

		new Setting(containerEl)
			.setName(
				`${this.isOverriddenByPeriodicNotes() ? 'Disabled: ' : ''}Template file for new weekly notes`,
			)
			.setDesc(
				this.isOverriddenByPeriodicNotes()
					? 'Using settings from periodic notes plugin.'
					: 'Optional path+filename to template file for new weekly notes.',
			)
			.addSearch((search) => {
				search
					.setPlaceholder('E.g. templates/weekly-note.md')
					.setValue(this.plugin.settings.templatePath);

				// Validate and save on blur
				search.inputEl.addEventListener('blur', async () => {
					const value = search.inputEl.value;
					const invalidPattern = !this.isValidFileNamingPattern(
						value.trim(),
					);

					if (invalidPattern) {
						const errorEl = this.createErrorMessageElement(
							'setting-filename-error',
							'Please enter a valid file naming pattern.',
						);
						search.inputEl.parentElement?.appendChild(errorEl);
						return;
					} else {
						const existingError = document.getElementById(
							'setting-filename-error',
						);
						if (existingError) {
							existingError.remove();
						}
						this.plugin.settings.fileNamingPattern = value;
						try {
							await this.plugin.saveSettings();
							this.plugin.refreshLifeCalendarView();
						} catch (error) {
							console.error(
								'Failed to save fileNamingPattern setting:',
								error instanceof Error ? error.message : error,
							);
						}
					}
				});

				// Attaches custom suggestions
				new FileSuggest(this.app, search.inputEl);
			});

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
}
