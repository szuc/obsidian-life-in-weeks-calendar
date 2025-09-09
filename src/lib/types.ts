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
	weekIntervals: Date[];
	weeks: Week[];
	hasWeeks: boolean;
}

export enum CalendarMode {
	BASIC = "basic",
	YEARLY = "yearly",
}
