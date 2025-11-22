/**
 * Shared constants for calendar components
 * Centralizes all layout and configuration values used across calendar implementations
 */

import type { LifeCalendarSettings } from './types';

export const CALENDAR_LAYOUT = {
	YEAR_GROUP_SIZE: 10,
} as const;

export const CALENDAR_VALIDATION = {
	// Lifespan validation bounds
	MIN_LIFESPAN: 1,
	MAX_LIFESPAN: 200,
	DEFAULT_LIFESPAN: 76,

	// Date validation bounds
	MIN_YEAR: 1900,

	// Fallback date (January 1, 2000)
	FALLBACK_DATE: {
		YEAR: 2000,
		MONTH: 0, // 0-indexed (January)
		DAY: 1,
	},
} as const;

/**
 * Default plugin settings.
 */
export const DEFAULT_SETTINGS: LifeCalendarSettings = {
	birthdate: '2000-01-01',
	projectedLifespan: '80',
	calendarMode: 'basic',
	viewLocation: 'main',
	confirmBeforeCreatingWeeklyNote: true,
	syncWithWeeklyNotes: false,
	fileNamePattern: 'gggg-[W]ww',
	fileLocation: '',
	weekStartDay: 'monday',
	templatePath: '',
};

export const VIEW_TYPE_LIFE_CALENDAR = 'life-in-weeks-calendar';
