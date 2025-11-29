import { Plugin } from 'obsidian';
import { LifeCalendarView } from 'src/view';
import { LifeCalendarSettingTab } from 'src/settingTab';
import {
	DEFAULT_SETTINGS,
	VIEW_TYPE_LIFE_CALENDAR,
} from 'src/lib/calendar-constants';
import type { LifeCalendarSettings } from 'src/lib/types';
import { activateView } from 'src/lib/viewManagement';
import { BirthdayManager } from 'src/lib/birthdayFeature';

export default class LifeCalendarPlugin extends Plugin {
	settings!: LifeCalendarSettings;
	private birthdayManager!: BirthdayManager;

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

		// Initialize birthday manager
		this.birthdayManager = new BirthdayManager(this);

		// Add custom view
		this.registerView(
			VIEW_TYPE_LIFE_CALENDAR,
			(leaf) => new LifeCalendarView(leaf, this),
		);

		// Add icon to left ribbon
		const ribbonIconEl = this.addRibbonIcon(
			'calendar-clock',
			'Open life in weeks calendar',
			async () => {
				await activateView(this.app, this.settings.viewLocation);
			},
		);
		ribbonIconEl.addClass('life-in-weeks-calendar-ribbon-class');

		// Add command
		this.addCommand({
			id: 'open-calendar',
			name: 'Open calendar',
			callback: async () => {
				await activateView(this.app, this.settings.viewLocation);
			},
		});

		// Check and show birthday message
		this.birthdayManager.checkAndShow(this.settings.birthdate);

		// Add settings tab
		this.addSettingTab(new LifeCalendarSettingTab(this.app, this));
	}

	override onunload() {
		this.birthdayManager.cleanup();
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
}
