/**
 * Third-party plugin integration utilities
 * Provides functions to check for and retrieve settings from Calendar, Journals, and Periodic Notes plugins
 */

import type { App } from 'obsidian';
import type { IntegrationSettings } from './types';
import { weekStartsOnIndexToString } from './utils';

/**
 * Retrieves the week start day setting from the 'Calendar' plugin.
 * @param app - Obsidian App instance
 * @returns The week start day as a string (e.g., 'monday'), or undefined
 */
export function getWeekStartsOnOptionFromCalendar(app: App): string | undefined {
	// @ts-ignore
	const calendarPlugin = app.plugins.getPlugin('calendar');
	return calendarPlugin?.options?.weekStart;
}

/**
 * Checks if the 'periodic-notes' plugin is installed with weekly notes enabled.
 * @param app - Obsidian App instance
 * @returns true if plugin exists and weekly notes are enabled
 */
export function weeklyPeriodicNotesPluginExists(app: App): boolean {
	// @ts-ignore
	const periodicNotes = app.plugins.getPlugin('periodic-notes');
	return periodicNotes && periodicNotes.settings?.weekly?.enabled;
}

/**
 * Retrieves weekly note settings from the 'Journals' plugin if it's installed and configured.
 * This is used for integration to help locate weekly notes.
 *
 * @param app - Obsidian App instance
 * @returns An object with weekly settings if found, otherwise undefined.
 * The returned object contains:
 * - `weekStartDay`: The configured start day of the week (e.g., 'sunday', 'monday').
 * - `fileNamePattern`: The date format pattern for weekly note file names.
 * - `folderPath`: The folder where weekly notes are stored.
 * - `templatePath`: The template file path for new weekly notes.
 * Returns `undefined` if the 'Journals' plugin is not found or if no weekly settings are configured.
 */
export function journalPluginWeeklySettings(app: App): IntegrationSettings | undefined {
	// @ts-ignore
	const journalsPlugin = app.plugins.getPlugin('journals');

	if (!journalsPlugin) {
		return undefined;
	}

	const weeksSettings = journalsPlugin.journals?.find(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(j: any) => j?.type === 'week',
	);

	// Return undefined if no weekly journal configuration exists
	if (!weeksSettings) {
		return undefined;
	}

	const weekStartDay: number | undefined =
		journalsPlugin.calendarSettings?.dow;
	const fileNamePattern: string | undefined =
		weeksSettings.config?.value?.nameTemplate;
	const folderPath: string | undefined =
		weeksSettings.config?.value?.folder;
	const templatePath: string | undefined =
		weeksSettings.config?.value?.templates?.[0];
	const dateFormat = weeksSettings.config?.value?.dateFormat;

	// If the folder path contains {{journal_name}} the replace that with weekSettings.name
	// There are other template variables but this is the only one we can resolve here
	const resolvedFolderPath = folderPath
		? folderPath.replace(
				'{{journal_name}}',
				weeksSettings.name || 'Weekly',
			)
		: '';

	// Journals plugin has a default date format option. We can convert
	// {{date}} to {{date:FORMAT}} in folderPath and fileNamePattern now rather than
	// passing the default through the entire codebase.
	const dateFormatToken = dateFormat.trim() ? `:${dateFormat}` : '';
	const fileNamePatternWithDateFormat = fileNamePattern
		? fileNamePattern.replace('{{date}}', `{{date${dateFormatToken}}}`)
		: '';
	const folderPathWithDateFormat = resolvedFolderPath
		? resolvedFolderPath.replace(
				'{{date}}',
				`{{date${dateFormatToken}}}`,
			)
		: '';

	return {
		weekStartDay: weekStartsOnIndexToString(weekStartDay) || '',
		fileNamePattern: fileNamePatternWithDateFormat || '',
		folderPath: folderPathWithDateFormat || '',
		templatePath: templatePath || '',
		dateFormat: dateFormat || '',
	};
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
	app: App
): Omit<IntegrationSettings, 'dateFormat'> | undefined {
	const periodicNotesSettings =
		// @ts-ignore
		app.plugins.getPlugin('periodic-notes');

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
