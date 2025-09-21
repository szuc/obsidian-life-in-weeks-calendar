import { Plugin, WorkspaceLeaf } from 'obsidian';
import { LifeCalendarView, VIEW_TYPE_LIFE_CALENDAR } from 'src/view';
import {
	type LifeCalendarSettings,
	LifeCalendarSettingTab,
	DEFAULT_SETTINGS,
} from 'src/settingTab';
import { createLocalDateYYYYMMDD, dateToYYYYMMDD } from 'src/lib/utils';

export default class LifeCalendarPlugin extends Plugin {
	settings!: LifeCalendarSettings;
	private lifeCalendarViews: Set<LifeCalendarView> = new Set();
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
			'Open Life in Weeks Calendar',
			() => {
				this.activateView();
			},
		);
		ribbonIconEl.addClass('life-in-weeks-calendar-ribbon-class');

		// Add a command to open the Life in Weeks Calendar view
		this.addCommand({
			id: 'open-life-in-weeks-calendar',
			name: 'Open calendar',
			callback: () => {
				this.activateView();
			},
		});

		// Check and show birthday message
		this.checkAndShowBirthday();

		// Add a settings tab
		this.addSettingTab(new LifeCalendarSettingTab(this.app, this));
	}

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
			this.statusBarItem.createEl('span', { text: '🎂 Happy Birthday!' });
		}
	}

	override onunload() {
		// Clear the view registry
		this.lifeCalendarViews.clear();
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

	registerLifeCalendarView(view: LifeCalendarView): void {
		this.lifeCalendarViews.add(view);
	}

	unregisterLifeCalendarView(view: LifeCalendarView): void {
		this.lifeCalendarViews.delete(view);
	}

	onSettingsChanged(): void {
		// Notify all registered LifeCalendarViews to refresh
		this.lifeCalendarViews.forEach((view) => {
			view.refreshView();
		});
	}

	getWeekStartsOnOptionFromCalendar(): string | undefined {
		// @ts-ignore
		const calendarPlugin = this.app.plugins.getPlugin('calendar');
		return calendarPlugin?.options?.weekStart;
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
		workspace.revealLeaf(leaf!);
	}
}
