import { ItemView, WorkspaceLeaf } from 'obsidian';
import LifeCalendar from 'src/ui/LifeCalendar.svelte';
import { mount } from 'svelte';
import type LifeCalendarPlugin from 'main';
import { DEFAULT_SETTINGS } from 'src/settingTab';
import { CreateFileModal } from 'src/createFileModal';

export const VIEW_TYPE_LIFE_CALENDAR = 'life-in-weeks-calendar';

export class LifeCalendarView extends ItemView {
	// A variable to hold on to the Counter instance mounted in this ItemView.
	lifeCalendar: ReturnType<typeof LifeCalendar> | undefined;
	plugin: LifeCalendarPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: LifeCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
		// Refresh the view when a new file is created or deleted
		this.registerEvent(
			this.app.vault.on('create', this.onFileChange, this),
		);
		this.registerEvent(
			this.app.vault.on('delete', this.onFileChange, this),
		);
	}

	getViewType(): string {
		return VIEW_TYPE_LIFE_CALENDAR;
	}

	getDisplayText(): string {
		return 'Life in Weeks Calendar';
	}

	override async onOpen() {
		// Register this view with the plugin for settings change notifications
		this.plugin.registerLifeCalendarView(this);

		this.mountComponent();
	}

	onFileChange(): void {
		if (!this.app.workspace.layoutReady) {
			// Workspace is still loading, do nothing
			return;
		}
		this.lifeCalendar?.refreshWeeklyNotes();
	}

	private buildComponentProps() {
		const settings = this.plugin.settings;
		return {
			birthdate: settings.birthdate || DEFAULT_SETTINGS.birthdate,
			projectedLifespan:
				settings.projectedLifespan ||
				DEFAULT_SETTINGS.projectedLifespan,
			calendarMode:
				settings.calendarMode || DEFAULT_SETTINGS.calendarMode,
			modalFn:
				(settings.confirmBeforeCreatingWeeklyNote ??
				DEFAULT_SETTINGS.confirmBeforeCreatingWeeklyNote)
					? (message: string, cb: () => void) => {
							new CreateFileModal(this.app, message, cb).open();
						}
					: undefined,
			syncWithWeeklyNotes:
				settings.syncWithWeeklyNotes ??
				DEFAULT_SETTINGS.syncWithWeeklyNotes,
			weekStartsOn: this.plugin.getWeekStartsOnOptionFromCalendar(),
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

	override async onClose() {
		this.cleanupComponent();
		this.plugin.unregisterLifeCalendarView(this);
	}
}
