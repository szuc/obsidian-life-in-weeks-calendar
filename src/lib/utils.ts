import { isThisWeek, getDay, nextDay } from 'date-fns';
import type { WeekStartsOn } from './types';
import type { TFile } from 'obsidian';
import { moment } from 'obsidian';

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
 * Periodic note plugin records are keyed by date strings in the format:
 * "week-YYYY-MM-DDT00:00:00+00:00" where the date is the start of the week
 * and the timezone offset is included.
 * This function generates that key for a given date.
 * @param date - The date for which to generate the key.
 * @returns The formatted key string.
 */
export function dateToDailyNoteRecordKeyFormat(date: Date): string {
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		throw new Error(
			'dateToDailyNoteRecordKeyFormat: date must be a valid Date object',
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
 * Corrects a bug where week start date might not match week start day depending on
 * the order of when the calendar sidebar is opened.
 * @param allWeeklyNotes - Weekly notes record from obsidian-daily-notes-interface
 * @param weekStartsOn - modified week start day from Calendar settings
 * @returns Weekly notes record with keys corrected to the week start day
 */
export function fixWeekRecordStartDates(
	allWeeklyNotes: Record<string, TFile> | undefined,
	weekStartsOn: string | undefined,
): Record<string, TFile> | undefined {
	if (allWeeklyNotes === undefined) return;
	if (weekStartsOn === undefined) return allWeeklyNotes;

	const newAllWeeklyNotes: Record<string, TFile> = allWeeklyNotes;
	// The keys on the objects might reflect the wrong day start
	for (const key in allWeeklyNotes) {
		const correctedKey = weeklyNoteKeyCorrection(key, weekStartsOn);
		newAllWeeklyNotes[correctedKey] = allWeeklyNotes[key];
	}
	return newAllWeeklyNotes;
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
	return dateToDailyNoteRecordKeyFormat(nextStartDay);
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
 * Converts an array of TFile objects into a Record with date-formatted keys.
 * @param fileNamePattern - Moment.js format pattern for parsing file names
 * @param weekStartDay - Day of the week that weeks start on
 * @param files - Array of TFile objects to process
 * @returns Record with date keys in the format `week-YYYY-MM-DDTHH:MM:SS+HH:MM`
 */
export function createFilesRecord(
	fileNamePattern: string,
	weekStartDay: string,
	files: TFile[],
): Record<string, TFile> | undefined {
	const record: Record<string, TFile> = {};
	// for each file see if the filename converts to a moment date using the user defined filename pattern
	files.forEach((file) => {
		const momentObject = moment(file.basename, fileNamePattern, true);
		if (momentObject.isValid()) {
			const dateKey = momentObject.format(
				`[week-]YYYY-MM-DDT00:00:00${momentObject.format('Z')}`,
			);
			//correct for the week start day
			const correctedKey = weeklyNoteKeyCorrection(dateKey, weekStartDay);
			record[correctedKey] = file;
		}
	});
	return record;
}
