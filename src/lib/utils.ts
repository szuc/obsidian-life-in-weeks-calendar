import { isThisWeek, getDay, nextDay } from 'date-fns';
import type { WeekStartsOn } from './types';
import type { TFile } from 'obsidian';
import { moment } from 'obsidian';
import { DEFAULT_SETTINGS } from './calendar-constants';

/** Global reference to the current date. Mutated by updateToday */
let TODAY = new Date();

/**
 * Updates the current date reference used by setWeekStatus.
 * Call this before rendering to ensure accurate date comparisons.
 */
export const updateToday = () => {
	TODAY = new Date();
};

/**
 * Determines if a week is in the past, present, or future.
 * @param weekStartDate - The start date of the week to check
 * @param validatedWeekStartsOn - The day of the week that weeks start on
 * @returns 'past', 'present', or 'future'
 */
export const setWeekStatus = (
	weekStartDate: Date,
	validatedWeekStartsOn: WeekStartsOn,
) => {
	if (
		!weekStartDate ||
		!(weekStartDate instanceof Date) ||
		isNaN(weekStartDate.getTime())
	) {
		throw new Error(
			'setWeekStatus: weekStartDate must be a valid Date object',
		);
	}

	if (
		isThisWeek(
			weekStartDate,
			validatedWeekStartsOn !== undefined
				? { weekStartsOn: validatedWeekStartsOn }
				: undefined,
		)
	)
		return 'present';
	if (weekStartDate < TODAY) return 'past';
	return 'future';
};

/**
 * Creates a local Date object from a string in "YYYY-MM-DD" format.
 * Creating a date from "YYYY-MM-DD" creates a date in UTC, not local time
 * which can lead to off-by-one-day errors depending on the user's timezone.
 * @param dateString - in "YYYY-MM-DD" format
 * @returns A Date object representing the input date in local time.
 */
export function createLocalDateYYYYMMDD(dateString: string): Date {
	if (!dateString || typeof dateString !== 'string') {
		throw new Error(
			'createLocalDateYYYYMMDD: dateString must be a non-empty string',
		);
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
		throw new Error(
			'createLocalDateYYYYMMDD: dateString must be in YYYY-MM-DD format',
		);
	}

	const [year, month, day] = dateString.split('-').map(Number);
	return new Date(year, month - 1, day);
}

/**
 * Formats a Date object into a "YYYY-MM-DD" string.
 * @param date - The date to format.
 * @returns The formatted date string.
 */
export function dateToYYYYMMDD(date: Date): string {
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		throw new Error('dateToYYYYMMDD: date must be a valid Date object');
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Based off of Periodic note plugin records which are keyed by date strings in the format:
 * "week-YYYY-MM-DDT00:00:00+00:00" where the date is the start of the week
 * and the timezone offset is included.
 * This function generates that key for a given date.
 * @param date - The date for which to generate the key.
 * @returns The formatted key string.
 */
export function dateToWeeklyNoteRecordKeyFormat(date: Date): string {
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		throw new Error(
			'dateToWeeklyNoteRecordKeyFormat: date must be a valid Date object',
		);
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const localTimeOffset = date.getTimezoneOffset();
	return `week-${year}-${month}-${day}T00:00:00${formatTimezoneOffset(localTimeOffset)}`;
}

/**
 * Helper function to format the timezone offset in "+HH:MM" or "-HH:MM" format.
 * @param offsetMinutes - The timezone offset in minutes.
 * @returns The formatted timezone offset string.
 */
function formatTimezoneOffset(offsetMinutes: number): string {
	if (typeof offsetMinutes !== 'number' || isNaN(offsetMinutes)) {
		throw new Error(
			'formatTimezoneOffset: offsetMinutes must be a valid number',
		);
	}

	const sign = offsetMinutes > 0 ? '-' : '+'; // getTimezoneOffset is reversed
	const absOffsetMinutes = Math.abs(offsetMinutes);

	const hours = Math.floor(absOffsetMinutes / 60);
	const minutes = absOffsetMinutes % 60;

	const paddedHours = String(hours).padStart(2, '0');
	const paddedMinutes = String(minutes).padStart(2, '0');

	return `${sign}${paddedHours}:${paddedMinutes}`;
}

/**
 * Checks if a value is a valid Date object.
 * @param d - The value to check.
 * @returns `true` if the value is a valid Date, `false` otherwise.
 */
export function isValidDate(d: Date): boolean {
	return d instanceof Date && !isNaN(d.getDate());
}

/**
 * Corrects the date key string for allWeeklyNotes records by adjusting the start date
 * if it doesn't match the configured week start day.
 * @param key - Custom date string in the format "week-YYYY-MM-DDT00:00:00+HH:MM"
 * @param weekStartsOn - Day of the week that weeks start on (e.g., "Monday", "Sunday")
 * @returns Corrected key string with the start date adjusted to the next occurrence of weekStartsOn
 */
export function weeklyNoteKeyCorrection(key: string, weekStartsOn: string) {
	// parse the wrong start date from the key.
	const dateString = key.slice(5, 15);
	const date = createLocalDateYYYYMMDD(dateString);
	const startDayIndex = weekStartsOnStringToIndex(weekStartsOn);
	// If the day is the same as weekStartsOnDate then either the start date is the default
	// or the weeks are set to the correct start date. If the weekStartsOn is undefined,
	// then it is the default. Just return the key unmodified
	if (getDay(date) === startDayIndex || startDayIndex === undefined) {
		return key;
	}
	// Else, return the a new key with the next instance of that day as the start date
	// (Trial and error led to this requirement)
	const nextStartDay = nextDay(date, startDayIndex);
	// convert it back into the expected format
	return dateToWeeklyNoteRecordKeyFormat(nextStartDay);
}

/**
 * Converts the string setting for first day of the week to a numeric index.
 * Case-insensitive matching.
 * @param weekStartsOn - Day of the week string (e.g., "Sunday", "Monday") or undefined
 * @returns Index of the day where 0=Sunday, 1=Monday, ..., 6=Saturday, or undefined if invalid/not provided
 */
export function weekStartsOnStringToIndex(weekStartsOn?: string): WeekStartsOn {
	switch (weekStartsOn?.toLocaleLowerCase()) {
		case 'sunday':
			return 0;
		case 'monday':
			return 1;
		case 'tuesday':
			return 2;
		case 'wednesday':
			return 3;
		case 'thursday':
			return 4;
		case 'friday':
			return 5;
		case 'saturday':
			return 6;
		default:
			return undefined;
	}
}

/**
 * Converts a day-of-the-week index (0-6) to its corresponding lowercase string representation.
 * @param index - The day index where 0=Sunday, 1=Monday, ..., 6=Saturday. Can be undefined.
 * @returns The lowercase name of the day (e.g., 'sunday', 'monday'), or undefined if the index is invalid or undefined.
 */
export function weekStartsOnIndexToString(
	index: number | undefined,
): string | undefined {
	switch (index) {
		case 0:
			return 'sunday';
		case 1:
			return 'monday';
		case 2:
			return 'tuesday';
		case 3:
			return 'wednesday';
		case 4:
			return 'thursday';
		case 5:
			return 'friday';
		case 6:
			return 'saturday';
		default:
			return undefined;
	}
}

/**
 * Converts an array of TFile objects into a Record with date-formatted keys.
 * Handles both static Moment.js format patterns and dynamic patterns with {{date:FORMAT}} segments.
 * Only includes files whose names can be parsed as valid dates using the provided pattern.
 * @param fileNamePattern - Moment.js format pattern for parsing file names (e.g., "YYYY-WW" or "Weekly-{{date:gggg-[W]ww}}")
 * @param weekStartDay - Day of the week that weeks start on (e.g., "Monday", "Sunday")
 * @param files - Array of TFile objects to process
 * @returns Record with date keys in the format `week-YYYY-MM-DDT00:00:00+HH:MM`, corrected for week start day
 */
export function createFilesRecord(
	fileNamePattern: string,
	weekStartDay: string,
	files: TFile[],
): Record<string, TFile> | undefined {
	const record: Record<string, TFile> = {};
	// For each file see if the filename converts to a moment date using the user defined filename pattern
	files.forEach((file) => {
		// filename pattern might be pure moment format or might contain dynamic segments
		const momentFormat = isStringDynamic(fileNamePattern)
			? extractMomentFormatFromPattern(fileNamePattern)
			: fileNamePattern;
		const momentObject = moment(file.basename, momentFormat, true);

		if (momentObject.isValid()) {
			const dateKey = momentObject.format(
				`[week-]YYYY-MM-DDT00:00:00${momentObject.format('Z')}`,
			);
			// Correct for the week start day
			const correctedKey = weeklyNoteKeyCorrection(dateKey, weekStartDay);
			record[correctedKey] = file;
		}
	});
	return record;
}

/**
 * Validates that a lifespan value is a valid integer within the allowed range.
 * @param value - The lifespan value to validate
 * @param minLifespan - Minimum allowed lifespan
 * @param maxLifespan - Maximum allowed lifespan
 * @returns `true` if the value is a valid integer between minLifespan and maxLifespan, `false` otherwise
 */
export function isValidLifespan(
	value: string,
	minLifespan: number,
	maxLifespan: number,
): boolean {
	const lifespan = Number(value);
	return (
		!isNaN(lifespan) &&
		Number.isInteger(lifespan) &&
		lifespan >= minLifespan &&
		lifespan <= maxLifespan
	);
}

/**
 * Validates that a file path is valid and ends with '.md'.
 * @param path - The file path to validate
 * @returns `true` if the file path is valid and ends with '.md', `false` otherwise
 */
export function isValidFileName(path: string): boolean {
	return path.trim() === '' || path.endsWith('.md');
}

/**
 * Gets the root folder path up to (but not including) the first dynamic segment.
 * Useful for determining where to start searching for files in dynamic folder structures.
 * @param folderPath - The folder path to analyze
 * @returns The path up to the first dynamic segment, with trailing slashes removed.
 *          If no dynamic segment exists, returns the entire path.
 * @example
 * getRootFolderOfFirstDynamicSegment("Journals/{{date}}/Notes")
 * // returns "Journals"
 * @example
 * getRootFolderOfFirstDynamicSegment("Static/Path")
 * // returns "Static/Path"
 */
export function getRootFolderOfFirstDynamicSegment(folderPath: string): string {
	const firstDynamicSegmentIndex = folderPath.indexOf('{{');
	return firstDynamicSegmentIndex !== -1
		? folderPath.substring(0, firstDynamicSegmentIndex).replace(
				/\/+$/,
				'', // Remove trailing slashes
			)
		: folderPath;
}

/**
 * Replaces dynamic segments in folder paths with formatted date values.
 * Dynamic segments must be valid Moment.js tokens in the format {{date:FORMAT}}.
 *
 * @param folderPath - The folder path containing dynamic segments to parse
 * @param date - The date to use for replacing dynamic segments
 * @param defaultFormat - The default Moment.js format to use if not specified in the segment (defaults to 'gggg-[W]ww')
 * @returns The folder path with all dynamic segments replaced with formatted date values
 * @example
 * parseDynamicFolderPath("Journals/{{date:YYYY}}/{{date:MM}}", new Date(2024, 2, 15))
 * // returns "Journals/2024/03"
 * @example
 * parseDynamicFolderPath("Notes/{{date}}/daily", new Date(2024, 2, 15))
 * // returns "Notes/2024-03-15/daily" (using defaultFormat)
 */
export function parseDynamicFolderPath(
	folderPath: string,
	date: Date,
	defaultFormat: string = DEFAULT_SETTINGS.fileNamePattern,
): string {
	if (!isStringDynamic(folderPath)) return folderPath;
	const parsedDates = parseDynamicDatesInString(
		folderPath,
		date,
		defaultFormat,
	);
	const parsedVariables = parseJournalsVariables(
		parsedDates,
		date,
		defaultFormat,
	);
	return parsedVariables;
}

/**
 * Checks if a string contains dynamic template variables.
 *
 * @param stringSegment - The string segment to check
 * @returns `true` if the segment contains template variables ({{ }}), `false` otherwise
 * @example
 * isStringDynamic("{{date}}") // returns true
 * isStringDynamic("journal") // returns false
 */
export function isStringDynamic(stringSegment: string): boolean {
	return stringSegment.includes('{{') && stringSegment.includes('}}');
}

/**
 * Extracts the Moment.js format pattern from a file name pattern containing dynamic segments.
 * Converts patterns like "Weekly-{{date:gggg-[W]ww}}" to "[Weekly-]gggg-[W]ww" for use with moment parsing.
 *
 * @param fileNamePattern - The file name pattern to extract from (e.g., "Weekly-{{date:gggg-[W]ww}}")
 * @returns The extracted Moment.js format string with literal text wrapped in brackets
 * @example
 * extractMomentFormatFromPattern("{{date:DD-MM-YYYY}}")
 * // returns "DD-MM-YYYY"
 * @example
 * extractMomentFormatFromPattern("Weekly-{{date:gggg-[W]ww}}")
 * // returns "[Weekly-]gggg-[W]ww"
 * @example
 * extractMomentFormatFromPattern("YYYY-WW")
 * // returns "[YYYY-WW]" (wraps literal text since no dynamic segment found)
 */
export function extractMomentFormatFromPattern(
	fileNamePattern: string,
): string {
	// Extract the moment format from the {{date:FORMAT}} segment if present
	const dynamicSegmentMatch = fileNamePattern.match(/\{\{date:([^}]+)\}\}/);

	if (dynamicSegmentMatch) {
		// Check if there's any literal text outside the {{date:FORMAT}} segment
		const beforeSegment = fileNamePattern.substring(
			0,
			dynamicSegmentMatch.index,
		);
		const afterSegment = fileNamePattern.substring(
			dynamicSegmentMatch.index! + dynamicSegmentMatch[0].length,
		);

		// Build the moment format: wrap literal parts in brackets, keep format as-is
		const wrappedBefore = beforeSegment ? `[${beforeSegment}]` : '';
		const wrappedAfter = afterSegment ? `[${afterSegment}]` : '';

		return `${wrappedBefore}${dynamicSegmentMatch[1]}${wrappedAfter}`;
	}

	// No dynamic segment found - wrap the entire pattern in brackets as literal text
	return `[${fileNamePattern}]`;
}

/**
 * Replaces all date dynamic segments in a string with formatted date values.
 * Dynamic segments can be {{date}} (uses default format) or {{date:FORMAT}} (uses specified Moment.js format).
 * Supports multiple dynamic segments in one string and preserves literal text between them.
 * @param dynamicString - The string containing dynamic date segments to parse
 * @param date - The date to use for replacing dynamic segments
 * @param defaultFormat - The default Moment.js format to use if not specified in the segment (defaults to 'gggg-[W]ww')
 * @returns The string with all {{date}} and {{date:FORMAT}} segments replaced with formatted date values
 * @example
 * parseDynamicDatesInString("{{date:YYYY}}", new Date(2024, 2, 15))
 * // returns "2024"
 * @example
 * parseDynamicDatesInString("{{date}}", new Date(2024, 2, 15))
 * // returns "2024-03-15" (using defaultFormat)
 * @example
 * parseDynamicDatesInString("Notes-{{date:gggg-[W]ww}}", new Date(2024, 2, 15))
 * // returns "Notes-2024-W11"
 * @example
 * parseDynamicDatesInString("Month-{{date:MM}}-Week-{{date:WW}}", new Date(2024, 2, 15))
 * // returns "Month-03-Week-11"
 */
export function parseDynamicDatesInString(
	dynamicString: string,
	date: Date,
	defaultFormat: string = DEFAULT_SETTINGS.fileNamePattern,
): string {
	// Matches {{date}} or {{date:FORMAT}} with optional whitespace
	// The 'g' flag enables global matching for multiple segments in one string
	const dynamicSegmentRegex = /{{\s*date(?::([^}]+))?\s*}}/g;

	// Replace all dynamic segments while preserving literal text between them
	return dynamicString.replace(dynamicSegmentRegex, (_, format) => {
		const momentFormat = format || defaultFormat;
		return moment(date).format(momentFormat).trim();
	});
}

/**
 * Replaces Journals plugin variables in a string with formatted date values.
 * Provides compatibility with the Obsidian Journals plugin's dynamic variable syntax.
 * @param text - A string containing 0 or more Journals plugin dynamic variables
 * @param date - The date to use for calculating week boundaries and formatting
 * @param defaultFormat - The Moment.js format to use for date replacements (defaults to 'YYYY-MM-DD')
 * @returns The string with all Journals variables replaced with formatted date values
 *
 * Supported variables:
 * - {{start_date}} - First day of the week (formatted using defaultFormat)
 * - {{end_date}} - Last day of the week (formatted using defaultFormat)
 * - {{current_date}} - The current date (formatted using defaultFormat)
 */
export function parseJournalsVariables(
	text: string,
	date: Date,
	defaultFormat: string = 'YYYY-MM-DD',
) {
	let result = text;

	const startOfWeek = moment(date).startOf('week');
	const endOfWeek = moment(date).endOf('week');

	result = result.replace(/{{\s*start_date\s*}}/g, () =>
		startOfWeek.format(defaultFormat).trim(),
	);
	result = result.replace(/{{\s*end_date\s*}}/g, () =>
		endOfWeek.format(defaultFormat).trim(),
	);
	result = result.replace(/{{\s*current_date\s*}}/g, () =>
		moment(date).format(defaultFormat).trim(),
	);

	return result;
}
