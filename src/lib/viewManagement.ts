/**
 * View lifecycle management utilities
 * Handles activation and refresh of Life Calendar views
 */

import type { App, WorkspaceLeaf } from 'obsidian';
import { LifeCalendarView } from '../view';
import { VIEW_TYPE_LIFE_CALENDAR } from './calendar-constants';

/**
 * Iterates through all open Life Calendar views and triggers a refresh.
 * This is typically called after settings have been changed to ensure the view
 * reflects the latest configuration.
 * @param app - Obsidian App instance
 */
export function refreshLifeCalendarView(app: App): void {
	for (const leaf of app.workspace.getLeavesOfType(
		VIEW_TYPE_LIFE_CALENDAR,
	)) {
		const view = leaf.view;
		if (view instanceof LifeCalendarView) {
			view.refreshView();
		}
	}
}

/**
 * Activates or creates a Life Calendar view in the workspace.
 * If a view already exists, it will be revealed. Otherwise, a new view
 * will be created in the specified location.
 * @param app - Obsidian App instance
 * @param viewLocation - Where to open the view ('main', 'left', or 'right')
 */
export async function activateView(
	app: App,
	viewLocation: string
): Promise<void> {
	const { workspace } = app;

	let leaf: WorkspaceLeaf | null = null;
	const leaves = workspace.getLeavesOfType(VIEW_TYPE_LIFE_CALENDAR);

	if (leaves.length > 0) {
		// A leaf with our view already exists, use that
		leaf = leaves[0];
	} else {
		// Our view could not be found in the workspace, create a new leaf
		const preferredLocation = viewLocation;
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
