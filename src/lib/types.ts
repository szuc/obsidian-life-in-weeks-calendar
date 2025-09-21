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
