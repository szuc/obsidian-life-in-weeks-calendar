import {
	eachWeekOfInterval,
	addYears,
	startOfWeek,
	addWeeks,
	subWeeks,
} from 'date-fns';
import type { Week, CalendarData, WeekStartsOn } from 'src/lib/types';
import {
	CALENDAR_LAYOUT,
	CALENDAR_VALIDATION,
} from 'src/lib/calendar-constants';
import { weekStartsOnStringToIndex } from './utils';

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
	getValidatedWeekStartsOn: (weekStartsOn?: string) => WeekStartsOn;
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
		getValidatedWeekStartsOn: (weekStartsOn?: string): WeekStartsOn => {
			return weekStartsOnStringToIndex(weekStartsOn);
		},
	};
}

/**
 * Calculates core calendar dates from validated inputs
 * @param validatedBirthDate - Validated birth date
 * @param validatedLifespan - Validated lifespan in years
 * @param validatedWeekStartsOn - The week start day as an index or undefined
 * @returns Object with calculated dates
 */
function calculateCalendarDates(
	validatedBirthDate: Date,
	validatedLifespan: number,
	validatedWeekStartsOn: WeekStartsOn,
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
		validatedWeekStartsOn !== undefined
			? { weekStartsOn: validatedWeekStartsOn }
			: undefined,
	);
	const deathDate = addYears(validatedBirthDate, validatedLifespan);
	const deathWeek = startOfWeek(
		deathDate,
		validatedWeekStartsOn !== undefined
			? { weekStartsOn: validatedWeekStartsOn }
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
 * @param validatedWeekStartsOn - The week start day as an index or undefined
 * @param componentName - Component name for error messages
 * @returns Array of week start dates or empty array on error
 */
function generateWeekIntervals(
	startWeek: Date,
	endWeek: Date,
	validatedWeekStartsOn: WeekStartsOn,
	componentName: string,
): Date[] {
	try {
		return eachWeekOfInterval(
			{
				start: startWeek,
				end: endWeek,
			},
			validatedWeekStartsOn !== undefined
				? { weekStartsOn: validatedWeekStartsOn }
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

	return weekIntervals.map((startDate, index) => ({
		index,
		startDate,
	}));
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
	const validatedWeekStartsOn =
		validation.getValidatedWeekStartsOn(weekStartsOn);

	// Calculate dates
	const { birthWeek, deathDate, deathWeek } = calculateCalendarDates(
		validatedBirthDate,
		validatedLifespan,
		validatedWeekStartsOn,
	);

	// Generate week intervals
	const weekIntervals = generateWeekIntervals(
		birthWeek,
		deathWeek,
		validatedWeekStartsOn,
		componentName,
	);

	// Create week objects
	const weeks = createWeekObjects(weekIntervals);

	return {
		validatedBirthDate,
		validatedLifespan,
		validatedWeekStartsOn,
		birthWeek,
		deathDate,
		deathWeek,
		weeks,
		hasWeeks: weeks.length > 0,
	};
}

/**
 * Groups weeks into year-based chunks for the yearly calendar display
 * Uses shared calendar data and adds year grouping functionality
 * @param validatedBirthDate - Birthdate
 * @param validatedLifespan - number of years the calendar spans
 * @param birthWeek - the first day of the week the containing the birthdate
 * @param validatedWeekStartsOn - The week start day as an index or undefined
 */
export function createYearGroups(
	validatedBirthDate: Date,
	validatedLifespan: number,
	birthWeek: Date,
	validatedWeekStartsOn: WeekStartsOn,
): Week[][] {
	const yearsPerGroup = CALENDAR_LAYOUT.YEAR_GROUP_SIZE;

	try {
		const yearGroups: Week[][] = [];
		const endDate = addYears(birthWeek, validatedLifespan);
		let currentStartDate = birthWeek;

		// Validate inputs
		if (
			!validatedBirthDate ||
			validatedLifespan <= 0 ||
			yearsPerGroup <= 0
		) {
			console.warn(
				'CalendarYearly: Invalid parameters for year grouping',
			);
			return [];
		}

		while (currentStartDate < endDate) {
			const currentEndDate = subWeeks(
				addYears(
					currentStartDate,
					Math.min(
						validatedLifespan - yearGroups.length * yearsPerGroup,
						yearsPerGroup,
					),
				),
				1,
			);

			const weekIntervals = generateWeekIntervals(
				currentStartDate,
				currentEndDate,
				validatedWeekStartsOn,
				'Yearly Calendar',
			);
			yearGroups.push(createWeekObjects(weekIntervals));
			currentStartDate = addWeeks(currentEndDate, 1);
		}

		return yearGroups;
	} catch (error) {
		console.error('CalendarYearly: Error in createYearGroups:', error);
		return []; // Return empty array as fallback
	}
}
