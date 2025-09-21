import { eachWeekOfInterval, addYears, startOfWeek } from 'date-fns';
import type { Week, CalendarData, WeekStartsOn } from 'src/lib/types';
import { CALENDAR_VALIDATION } from 'src/lib/calendar-constants';

/**
 * Creates validation functions for a calendar component
 * @param componentName - Name of the component for error messages
 * @returns Object with validation functions and fallback values
 */
function createCalendarValidation(componentName: string): {
	isValidDate: (date: Date) => boolean;
	isValidLifespan: (lifespan: number) => boolean;
	getValidatedBirthDate: (date: Date) => Date;
	getValidatedLifespan: (lifespan: number) => number;
	getValidatedWeekStart: (weekStartsOn?: string) => WeekStartsOn;
} {
	if (
		!componentName ||
		typeof componentName !== 'string' ||
		componentName.trim() === ''
	) {
		throw new Error(
			'createCalendarValidation: componentName must be a non-empty string',
		);
	}
	return {
		isValidDate: (date: Date): boolean => {
			return date instanceof Date && !isNaN(date.getTime());
		},

		isValidLifespan: (lifespan: number): boolean => {
			return (
				typeof lifespan === 'number' &&
				lifespan >= CALENDAR_VALIDATION.MIN_LIFESPAN &&
				lifespan <= CALENDAR_VALIDATION.MAX_LIFESPAN
			);
		},

		getValidatedBirthDate: (date: Date): Date => {
			if (date instanceof Date && !isNaN(date.getTime())) {
				return date;
			}
			console.warn(
				`${componentName}: Invalid birth date provided, using fallback`,
			);
			return new Date(
				CALENDAR_VALIDATION.FALLBACK_DATE.YEAR,
				CALENDAR_VALIDATION.FALLBACK_DATE.MONTH,
				CALENDAR_VALIDATION.FALLBACK_DATE.DAY,
			);
		},

		getValidatedLifespan: (lifespan: number): number => {
			if (
				typeof lifespan === 'number' &&
				lifespan >= CALENDAR_VALIDATION.MIN_LIFESPAN &&
				lifespan <= CALENDAR_VALIDATION.MAX_LIFESPAN
			) {
				return lifespan;
			}
			console.warn(
				`${componentName}: Invalid lifespan provided, using fallback of ${CALENDAR_VALIDATION.DEFAULT_LIFESPAN} years`,
			);
			return CALENDAR_VALIDATION.DEFAULT_LIFESPAN;
		},
		getValidatedWeekStart: (weekStartsOn?: string): WeekStartsOn => {
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
		},
	};
}

/**
 * Calculates core calendar dates from validated inputs
 * @param validatedBirthDate - Validated birth date
 * @param validatedLifespan - Validated lifespan in years
 * @returns Object with calculated dates
 */
function calculateCalendarDates(
	validatedBirthDate: Date,
	validatedLifespan: number,
	validatedWeekStart: WeekStartsOn,
) {
	if (
		!validatedBirthDate ||
		!(validatedBirthDate instanceof Date) ||
		isNaN(validatedBirthDate.getTime())
	) {
		throw new Error(
			'calculateCalendarDates: validatedBirthDate must be a valid Date object',
		);
	}

	if (
		typeof validatedLifespan !== 'number' ||
		isNaN(validatedLifespan) ||
		validatedLifespan <= 0
	) {
		throw new Error(
			'calculateCalendarDates: validatedLifespan must be a positive number',
		);
	}

	const birthWeek = startOfWeek(
		validatedBirthDate,
		validatedWeekStart !== undefined
			? {
					weekStartsOn: validatedWeekStart,
				}
			: undefined,
	);
	const deathDate = addYears(validatedBirthDate, validatedLifespan);
	const deathWeek = startOfWeek(
		deathDate,
		validatedWeekStart !== undefined
			? {
					weekStartsOn: validatedWeekStart,
				}
			: undefined,
	);

	return {
		birthWeek,
		deathDate,
		deathWeek,
	};
}

/**
 * Generates week intervals with error handling
 * @param startWeek - Starting week date
 * @param endWeek - Ending week date
 * @param componentName - Component name for error messages
 * @param validatedWeekStart - Index of first day or week (0 = Sunday, 6 = Saturday). Undefined defaults to locale
 * @returns Array of week start dates or empty array on error
 */
function generateWeekIntervals(
	startWeek: Date,
	endWeek: Date,
	componentName: string,
	validatedWeekStart: WeekStartsOn,
): Date[] {
	try {
		return eachWeekOfInterval(
			{
				start: startWeek,
				end: endWeek,
			},
			validatedWeekStart !== undefined
				? {
						weekStartsOn: validatedWeekStart,
					}
				: undefined,
		);
	} catch (error) {
		console.error(
			`${componentName}: Error calculating week intervals:`,
			error instanceof Error ? error.message : error,
		);
		return [];
	}
}

/**
 * Converts week start dates to Week objects for rendering
 * @param weekIntervals - Array of week start dates
 * @returns Array of Week objects with index and startDate
 */
function createWeekObjects(weekIntervals: Date[]): Week[] {
	if (!weekIntervals || !Array.isArray(weekIntervals)) {
		throw new Error(
			'createWeekObjects: weekIntervals must be a valid array',
		);
	}

	return weekIntervals.map((startDate, index) => ({ index, startDate }));
}

/**
 * Complete calendar data generation pipeline
 * Combines validation, date calculation, and week generation
 * @param birthDate - Raw birth date input
 * @param lifespan - Raw lifespan input
 * @param componentName - Component name for error messages
 * @param weekStartsOn - first day of week or "locale"
 * @returns Complete calendar data object
 */
export default function generateCalendarData(
	birthDate: Date,
	lifespan: number,
	componentName: string,
	weekStartsOn?: string,
): CalendarData {
	if (!birthDate || !(birthDate instanceof Date)) {
		throw new Error(
			'generateCalendarData: birthDate must be a Date object',
		);
	}

	if (typeof lifespan !== 'number' || isNaN(lifespan)) {
		throw new Error('generateCalendarData: lifespan must be a number');
	}

	if (
		!componentName ||
		typeof componentName !== 'string' ||
		componentName.trim() === ''
	) {
		throw new Error(
			'generateCalendarData: componentName must be a non-empty string',
		);
	}

	const validation = createCalendarValidation(componentName);

	// Validate inputs
	const validatedBirthDate = validation.getValidatedBirthDate(birthDate);
	const validatedLifespan = validation.getValidatedLifespan(lifespan);
	const validatedWeekStart = validation.getValidatedWeekStart(weekStartsOn);

	// Calculate dates
	const { birthWeek, deathDate, deathWeek } = calculateCalendarDates(
		validatedBirthDate,
		validatedLifespan,
		validatedWeekStart,
	);

	// Generate week intervals
	const weekIntervals = generateWeekIntervals(
		birthWeek,
		deathWeek,
		componentName,
		validatedWeekStart,
	);

	// Create week objects
	const weeks = createWeekObjects(weekIntervals);

	return {
		validatedBirthDate,
		validatedLifespan,
		validatedWeekStart,
		birthWeek,
		deathDate,
		deathWeek,
		weekIntervals,
		weeks,
		hasWeeks: weeks.length > 0,
	};
}
