import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import LifeCalendar from 'src/ui/LifeCalendar.svelte';
import { mount } from 'svelte';
import type LifeCalendarPlugin from 'main';
import { DEFAULT_SETTINGS } from 'src/settingTab';
import { CreateFileModal } from 'src/createFileModal';
import {
	appHasDailyNotesPluginLoaded,
	getAllWeeklyNotes,
} from 'obsidian-daily-notes-interface';
import { fixWeekStartDate } from './lib/utils';

export const VIEW_TYPE_LIFE_CALENDAR = 'life-in-weeks-calendar';

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
		// Register this view with the plugin for settings change notifications
		this.plugin.registerLifeCalendarView(this);
		this.mountComponent();
		return Promise.resolve();
	}

	/**
	 * Use obsidian-daily-notes-interface to get all the weekly notes then correct
	 * for a bug in the weekly notes interface that keys the notes record to the wrong
	 * week start date if the first day of the week has been edited in Calendar plugin
	 * but the Calendar view hasn't been opened before the Life in Weeks view has.
	 */
	private getAllWeeklyNotesDateCorrected():
		| Record<string, TFile>
		| undefined {
		let allWeeklyNotes: Record<string, TFile> | undefined;
		if (
			appHasDailyNotesPluginLoaded() &&
			(this.plugin.settings.syncWithWeeklyNotes ??
				DEFAULT_SETTINGS.syncWithWeeklyNotes)
		) {
			allWeeklyNotes = getAllWeeklyNotes();
		}
		return fixWeekStartDate(
			allWeeklyNotes,
			this.plugin.getWeekStartsOnOptionFromCalendar(),
		);
	}

	private buildComponentProps() {
		const settings = this.plugin.settings;
		const weeklyNotesEnabled =
			this.plugin.weeklyPeriodicNotesPluginExists();
		const syncWithWeeklyNotes =
			weeklyNotesEnabled &&
			(settings.syncWithWeeklyNotes ??
				DEFAULT_SETTINGS.syncWithWeeklyNotes);
		const modalFunction = (message: string, cb: () => void) => {
			new CreateFileModal(this.app, message, cb).open();
		};
		const modalFn = weeklyNotesEnabled
			? (settings.confirmBeforeCreatingWeeklyNote ??
				DEFAULT_SETTINGS.confirmBeforeCreatingWeeklyNote)
				? modalFunction
				: undefined
			: undefined;
		return {
			birthdate: settings.birthdate ?? DEFAULT_SETTINGS.birthdate,
			projectedLifespan:
				settings.projectedLifespan ??
				DEFAULT_SETTINGS.projectedLifespan,
			calendarMode:
				settings.calendarMode ?? DEFAULT_SETTINGS.calendarMode,
			modalFn: modalFn,
			syncWithWeeklyNotes: syncWithWeeklyNotes,
			weekStartsOn: this.plugin.getWeekStartsOnOptionFromCalendar(),
			allWeeklyNotes: this.getAllWeeklyNotesDateCorrected(),
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
		this.plugin.unregisterLifeCalendarView();
		return Promise.resolve();
	}
}
