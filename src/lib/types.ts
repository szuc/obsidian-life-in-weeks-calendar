export interface Week {
	index: number;
	startDate: Date;
}

export interface CalendarData {
	validatedBirthDate: Date;
	validatedLifespan: number;
	birthWeek: Date;
	deathDate: Date;
	deathWeek: Date;
	weeks: Week[];
	hasWeeks: boolean;
	validatedWeekStartsOn: WeekStartsOn;
}

export enum CalendarMode {
	BASIC = 'basic',
	YEARLY = 'yearly',
}

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;

/**
 * Configuration settings for the Life Calendar plugin.
 */
export interface LifeCalendarSettings {
	birthdate: string;
	projectedLifespan: string;
	calendarMode: string;
	viewLocation: string;
	confirmBeforeCreatingWeeklyNote: boolean;
	syncWithWeeklyNotes: boolean;
	fileNamePattern: string;
	fileLocation: string;
	weekStartDay: string;
	templatePath: string;
	/** Whether to sync weekly note settings with the Journals plugin. */
	syncWithJournalNotes: boolean;
}
