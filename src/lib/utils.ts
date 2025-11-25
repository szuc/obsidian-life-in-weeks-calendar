import { isThisWeek, getDay, nextDay } from 'date-fns';
import type { WeekStartsOn } from './types';
import type { TFile } from 'obsidian';
import { moment, normalizePath } from 'obsidian';

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
 * Corrects the date key string for allWeeklyNotes records.
 * @param key - Custom date string used in allWeeklyNotes record
 * @param weekStartsOn - Day of the week that weeks start on
 * @returns Corrected key string
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
 * Converts the string setting for first day of the week to an index.
 * @param weekStartsOn - Day of the week string or undefined
 * @returns Index of the day (0-6) or undefined
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
 * @param index - The day index, where 0 is Sunday, 1 is Monday, and so on. Can be undefined.
 * @returns The lowercase name of the day (e.g., 'sunday', 'monday'), or an empty string if the index is invalid or undefined.
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
 * @param fileNamePattern - Moment.js format pattern for parsing file names
 * @param weekStartDay - Day of the week that weeks start on
 * @param files - Array of TFile objects to process
 * @returns Record with date keys in the format `week-YYYY-MM-DDT00:00:00+HH:MM`
 */
export function createFilesRecord(
	fileNamePattern: string,
	weekStartDay: string,
	files: TFile[],
): Record<string, TFile> | undefined {
	const record: Record<string, TFile> = {};
	// For each file see if the filename converts to a moment date using the user defined filename pattern
	files.forEach((file) => {
		const momentObject = moment(file.basename, fileNamePattern, true);
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
 * Tests for filesystem characters that are unsafe across Windows, macOS, and Linux.
 * @param value - The string to test for unsafe characters
 * @returns `true` if the value contains unsafe filesystem characters, `false` otherwise
 */
export function containsUnsafeCharacters(value: string): boolean {
	const unsafeCharacters = /[<>:"|?*\\]/;
	return unsafeCharacters.test(value);
}

/**
 * Validates that a file naming pattern contains only safe characters and has balanced brackets.
 * @param pattern - The Moment.js date format pattern to validate
 * @returns `true` if the pattern is valid (safe characters and balanced brackets), `false` otherwise
 */
export function isValidFileNamePattern(pattern: string): boolean {
	// Empty pattern is valid (falls back to default)
	if (pattern === '') return true;

	// Check for filesystem-unsafe characters
	if (containsUnsafeCharacters(pattern)) return false;

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
 * Validates that a path contains only safe characters and no relative path markers.
 * @param path - The path to validate
 * @returns `true` if the path is valid (safe characters, no relative paths), `false` otherwise
 */
export function isValidPath(path: string): boolean {
	path = path.trim();
	// Empty path is valid (vault root)
	if (path === '') return true;

	// Check for filesystem-unsafe characters (allow / for folder separators)
	if (containsUnsafeCharacters(path)) return false;

	try {
		const normalized = normalizePath(path);
		if (normalized === '') return false;

		// Check for problematic path segments
		const segments = normalized.split('/');
		for (const segment of segments) {
			if (segment.endsWith('.')) return false;
			if (segment === '.' || segment === '..') return false;
		}

		return true;
	} catch {
		return false;
	}
}

/**
 * Validates that a file path is valid and ends with '.md'.
 * @param path - The file path to validate
 * @returns `true` if the file path is valid and ends with '.md', `false` otherwise
 */
export function isValidFileName(path: string): boolean {
	if (path.trim() === '') return true;
	return isValidPath(path) && path.endsWith('.md');
}

/**
 * Normalizes a folder path by trimming whitespace and removing leading/trailing slashes.
 * @param path - The folder path to normalize
 * @returns The normalized path without leading/trailing slashes
 */
export function normalizeFolderPath(path: string): string {
	path = path.trim();
	if (path === '') return '';
	return normalizePath(path);
}
