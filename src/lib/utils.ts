import { isThisWeek } from 'date-fns';
import type { WeekStartsOn } from './types';

/** Helper for determining Week class name */
const TODAY = new Date();
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
export function dateToDailyNoteFormatRecordKey(date: Date): string {
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		throw new Error(
			'dateToDailyNoteFormatRecordKey: date must be a valid Date object',
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

export function isValidDate(d: Date): boolean {
	return d instanceof Date && !isNaN(d.getDate());
}
