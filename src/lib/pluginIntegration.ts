/**
 * Third-party plugin integration utilities
 * Provides functions to check for and retrieve settings from Calendar, Journals, and Periodic Notes plugins
 */

import type { App } from 'obsidian';
import type { IntegrationSettings } from './types';
import { getJournalsApi } from 'obsidian-journals-api';

/**
 * WARNING: The following interfaces define the expected shape of 3rd-party plugin
 * settings (Calendar, Periodic Notes, Journals).
 *
 * These types are declared here to provide type safety and fix linting errors, but they
 * DO NOT guarantee runtime safety. If a 3rd-party plugin changes its internal state
 * or configuration structure, accessing these properties at runtime could still
 * result in unexpected behavior or `undefined` values.
 *
 * Always use optional chaining (`?.`) and fallback values when accessing these
 * properties to prevent fatal runtime errors.
 */
interface CalendarPlugin {
	options?: {
		weekStart?: string;
	};
}

interface PeriodicNotesPlugin {
	settings?: {
		weekly?: {
			enabled?: boolean;
			format?: string;
			folder?: string;
			template?: string;
		};
	};
}

interface AppWithPlugins extends App {
	plugins: {
		getPlugin(id: 'calendar'): CalendarPlugin | undefined;
		getPlugin(id: 'periodic-notes'): PeriodicNotesPlugin | undefined;
		getPlugin(id: string): unknown;
	};
}

/**
 * Retrieves the week start day setting from the 'Calendar' plugin.
 * @param app - Obsidian App instance
 * @returns The week start day as a string (e.g., 'monday'), or undefined
 */
export function getWeekStartsOnOptionFromCalendar(
	app: App,
): string | undefined {
	const calendarPlugin = (app as AppWithPlugins).plugins.getPlugin(
		'calendar',
	);
	return calendarPlugin?.options?.weekStart;
}

/**
 * Checks if the 'periodic-notes' plugin is installed with weekly notes enabled.
 * @param app - Obsidian App instance
 * @returns true if plugin exists and weekly notes are enabled
 */
export function weeklyPeriodicNotesPluginExists(app: App): boolean {
	const periodicNotes = (app as AppWithPlugins).plugins.getPlugin(
		'periodic-notes',
	);
	return !!periodicNotes?.settings?.weekly?.enabled;
}

/**
 * Checks if the 'Journals' plugin is installed and enabled, and exposes the API.
 * @param app - Obsidian App instance
 * @returns true if plugin exists and exposes the API
 */
export function journalsPluginExists(app: App): boolean {
	return !!getJournalsApi(app);
}

/**
 * Retrieves weekly note settings from the 'Periodic Notes' plugin if it's installed
 * and configured. Gets the week start day from the Calendar plugin if available.
 * (Both 'Periodic Notes' and 'Calendar' plugins are by the same author.)
 *
 * @param app - Obsidian App instance
 * @returns An object with weekly settings if found, otherwise undefined.
 * The returned object contains:
 * - `weekStartDay`: The configured start day of the week (e.g., 'sunday', 'monday').
 * - `fileNamePattern`: The date format pattern for weekly note file names.
 * - `folderPath`: The folder where weekly notes are stored.
 * - `templatePath`: The template file path for new weekly notes.
 * Returns `undefined` if the 'Periodic Notes' plugin is not found or if weekly notes are
 * not enabled.
 */
export function periodicNotesPluginWeeklySettings(
	app: App,
): Omit<IntegrationSettings, 'dateFormat'> | undefined {
	const periodicNotesSettings = (app as AppWithPlugins).plugins.getPlugin(
		'periodic-notes',
	);

	if (!periodicNotesSettings) {
		return undefined;
	}

	const weeklySettings = periodicNotesSettings.settings?.weekly;
	if (!weeklySettings?.enabled) {
		return undefined;
	}
	return {
		weekStartDay: getWeekStartsOnOptionFromCalendar(app) || '',
		fileNamePattern: weeklySettings.format || '',
		folderPath: weeklySettings.folder || '',
		templatePath: weeklySettings.template || '',
	};
}
