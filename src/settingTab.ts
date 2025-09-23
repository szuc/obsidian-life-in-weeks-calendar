import LifeCalendarPlugin from 'main';
import { App, PluginSettingTab, Setting } from 'obsidian';
import { CALENDAR_VALIDATION } from 'src/lib/calendar-constants';
import { dateToYYYYMMDD, isValidDate } from 'src/lib/utils';

export interface LifeCalendarSettings {
	birthdate: string;
	projectedLifespan: string;
	calendarMode: string;
	viewLocation: string;
	confirmBeforeCreatingWeeklyNote: boolean;
	syncWithWeeklyNotes: boolean;
}

export const DEFAULT_SETTINGS: LifeCalendarSettings = {
	birthdate: '2000-01-01',
	projectedLifespan: '80',
	calendarMode: 'basic',
	viewLocation: 'main',
	confirmBeforeCreatingWeeklyNote: true,
	syncWithWeeklyNotes: true,
};

const createErrorMessageElement = (
	id: string,
	message: string,
): HTMLElement => {
	const existingError = document.getElementById(id);
	if (existingError) {
		existingError.remove();
	}
	const errorEl = document.createElement('div');
	errorEl.textContent = message;
	errorEl.id = id;
	errorEl.className = 'lwc__error-message';
	return errorEl;
};

export class LifeCalendarSettingTab extends PluginSettingTab {
	plugin: LifeCalendarPlugin;
	calendarPluginWeekStartsOn: string | undefined;

	constructor(app: App, plugin: LifeCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.calendarPluginWeekStartsOn =
			this.plugin.getWeekStartsOnOptionFromCalendar();
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('p', {
			text: 'Note: Settings related to weekly note integrations might require closing the weekly calendar and reopening it for changes to take effect.',
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
							const errorEl = createErrorMessageElement(
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
								this.plugin.onSettingsChanged();
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
					if (!value) {
						const errorEl = createErrorMessageElement(
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
							this.plugin.onSettingsChanged();
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
			.setDesc('Basic mode is better for sidebar or mobile views.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('basic', 'Basic')
					.addOption('yearly', 'Yearly')
					.setValue(this.plugin.settings.calendarMode)
					.onChange(async (value) => {
						this.plugin.settings.calendarMode = value;
						await this.plugin.saveSettings();
						this.plugin.onSettingsChanged();
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
					.addOption('left', 'Left Sidebar')
					.addOption('right', 'Right Sidebar')
					.setValue(this.plugin.settings.viewLocation)
					.onChange(async (value) => {
						this.plugin.settings.viewLocation = value;
						await this.plugin.saveSettings();
						this.plugin.onSettingsChanged();
					}),
			);

		if (!this.plugin.weeklyPeriodicNotesPluginExists()) {
			this.containerEl.createDiv('lwc-settings-banner', (banner) => {
				banner.createEl('h3', {
					text: '⚠️ Weekly Notes not enabled',
				});
				banner.createEl('p', {
					cls: 'lwc-setting-item-description',
					text: 'The Life in Weeks Calendar is best with the Periodic Notes plugin weekly notes enabled (available in the Community Plugins catalog).',
				});
			});
		}

		new Setting(containerEl)
			.setName("Integrate with Periodic Notes plugin's weekly notes")
			.setDesc(
				'Allows quick linking to weekly notes and shows a dot on weeks with a corresponding weekly note. Requires Periodic Notes plugin to be installed.',
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
						this.plugin.onSettingsChanged();
					})
					.setDisabled(
						!this.plugin.weeklyPeriodicNotesPluginExists(),
					),
			);

		new Setting(containerEl)
			.setName('Confirm before creating weekly note')
			.setDesc(
				'Require confirmation before creating a new weekly note. Requires Periodic Notes plugin to be installed.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.weeklyPeriodicNotesPluginExists() &&
							this.plugin.settings
								.confirmBeforeCreatingWeeklyNote,
					)
					.onChange(async (value) => {
						this.plugin.settings.confirmBeforeCreatingWeeklyNote =
							value;
						await this.plugin.saveSettings();
						this.plugin.onSettingsChanged();
					})
					.setDisabled(
						!this.plugin.weeklyPeriodicNotesPluginExists(),
					),
			);
	}
}
