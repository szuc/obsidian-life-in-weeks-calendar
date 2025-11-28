import { startOfWeek } from 'date-fns';
import { CALENDAR_VALIDATION, CALENDAR_LAYOUT } from '../calendar-constants';
import generateCalendarData, {
	createYearGroups,
} from '../generateCalendarData';

describe('generateCalendarData.ts', () => {
	describe('generateCalendarData', () => {
		it('should generate calendar data with valid inputs', () => {
			const birthDate = new Date(1990, 0, 1);
			const lifespan = 80;

			const result = generateCalendarData(
				birthDate,
				lifespan,
				'TestComponent',
			);

			expect(result.validatedBirthDate).toEqual(birthDate);
			expect(result.validatedLifespan).toBe(lifespan);
			expect(result.birthWeek).toBeInstanceOf(Date);
			expect(result.deathDate).toBeInstanceOf(Date);
			expect(result.deathWeek).toBeInstanceOf(Date);
			expect(Array.isArray(result.weeks)).toBe(true);
			expect(result.weeks.length).toBeGreaterThan(0);
			expect(result.hasWeeks).toBe(true);

			// Verify death date is 80 years after birth
			expect(result.deathDate.getFullYear()).toBe(2070);
		});

		it('should generate correct number of weeks', () => {
			const birthDate = new Date(2000, 0, 1);
			const lifespan = 1; // 1 year should be approximately 52 weeks

			const result = generateCalendarData(
				birthDate,
				lifespan,
				'TestComponent',
			);

			// 1 year should have around 52-53 weeks
			expect(result.weeks.length).toBeGreaterThanOrEqual(52);
			expect(result.weeks.length).toBeLessThanOrEqual(54);
		});

		it('should use fallback birthdate for invalid date', () => {
			const invalidDate = new Date('invalid');
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			const result = generateCalendarData(
				invalidDate,
				80,
				'TestComponent',
			);

			expect(result.validatedBirthDate).toEqual(
				new Date(
					CALENDAR_VALIDATION.FALLBACK_DATE.YEAR,
					CALENDAR_VALIDATION.FALLBACK_DATE.MONTH,
					CALENDAR_VALIDATION.FALLBACK_DATE.DAY,
				),
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid birth date provided'),
			);

			consoleSpy.mockRestore();
		});

		it('should use fallback lifespan for invalid lifespan (too low)', () => {
			const birthDate = new Date(1990, 0, 1);
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			const result = generateCalendarData(birthDate, 0, 'TestComponent');

			expect(result.validatedLifespan).toBe(
				CALENDAR_VALIDATION.DEFAULT_LIFESPAN,
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid lifespan provided'),
			);

			consoleSpy.mockRestore();
		});

		it('should use fallback lifespan for invalid lifespan (too high)', () => {
			const birthDate = new Date(1990, 0, 1);
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			const result = generateCalendarData(
				birthDate,
				250,
				'TestComponent',
			);

			expect(result.validatedLifespan).toBe(
				CALENDAR_VALIDATION.DEFAULT_LIFESPAN,
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid lifespan provided'),
			);

			consoleSpy.mockRestore();
		});

		it('should accept valid lifespan at minimum boundary', () => {
			const birthDate = new Date(1990, 0, 1);

			const result = generateCalendarData(
				birthDate,
				CALENDAR_VALIDATION.MIN_LIFESPAN,
				'TestComponent',
			);

			expect(result.validatedLifespan).toBe(
				CALENDAR_VALIDATION.MIN_LIFESPAN,
			);
		});

		it('should accept valid lifespan at maximum boundary', () => {
			const birthDate = new Date(1990, 0, 1);

			const result = generateCalendarData(
				birthDate,
				CALENDAR_VALIDATION.MAX_LIFESPAN,
				'TestComponent',
			);

			expect(result.validatedLifespan).toBe(
				CALENDAR_VALIDATION.MAX_LIFESPAN,
			);
		});

		it('should throw error for non-Date birthDate', () => {
			expect(() =>
				generateCalendarData('not a date' as any, 80, 'TestComponent'),
			).toThrow('generateCalendarData: birthDate must be a Date object');
		});

		it('should throw error for null birthDate', () => {
			expect(() =>
				generateCalendarData(null as any, 80, 'TestComponent'),
			).toThrow('generateCalendarData: birthDate must be a Date object');
		});

		it('should throw error for undefined birthDate', () => {
			expect(() =>
				generateCalendarData(undefined as any, 80, 'TestComponent'),
			).toThrow('generateCalendarData: birthDate must be a Date object');
		});

		it('should throw error for non-number lifespan', () => {
			expect(() =>
				generateCalendarData(
					new Date(),
					'eighty' as any,
					'TestComponent',
				),
			).toThrow('generateCalendarData: lifespan must be a number');
		});

		it('should throw error for NaN lifespan', () => {
			expect(() =>
				generateCalendarData(new Date(), NaN, 'TestComponent'),
			).toThrow('generateCalendarData: lifespan must be a number');
		});

		it('should throw error for empty componentName', () => {
			expect(() => generateCalendarData(new Date(), 80, '')).toThrow(
				'generateCalendarData: componentName must be a non-empty string',
			);
		});

		it('should throw error for whitespace-only componentName', () => {
			expect(() => generateCalendarData(new Date(), 80, '   ')).toThrow(
				'generateCalendarData: componentName must be a non-empty string',
			);
		});

		it('should throw error for non-string componentName', () => {
			expect(() =>
				generateCalendarData(new Date(), 80, 123 as any),
			).toThrow(
				'generateCalendarData: componentName must be a non-empty string',
			);
		});

		it('should throw error for null componentName', () => {
			expect(() =>
				generateCalendarData(new Date(), 80, null as any),
			).toThrow(
				'generateCalendarData: componentName must be a non-empty string',
			);
		});

		it('should handle weekStartsOn parameter (Monday)', () => {
			const birthDate = new Date(2000, 0, 3); // Monday, Jan 3, 2000

			const result = generateCalendarData(
				birthDate,
				1,
				'TestComponent',
				'Monday',
			);

			expect(result.validatedWeekStartsOn).toBe(1);
			// Birth week should start on Monday
			expect(result.birthWeek.getDay()).toBe(1);
		});

		it('should handle weekStartsOn parameter (Sunday)', () => {
			const birthDate = new Date(2000, 0, 3); // Monday, Jan 3, 2000

			const result = generateCalendarData(
				birthDate,
				1,
				'TestComponent',
				'Sunday',
			);

			expect(result.validatedWeekStartsOn).toBe(0);
			// Birth week should start on Sunday
			expect(result.birthWeek.getDay()).toBe(0);
		});

		it('should handle undefined weekStartsOn', () => {
			const birthDate = new Date(2000, 0, 1);

			const result = generateCalendarData(birthDate, 1, 'TestComponent');

			expect(result.validatedWeekStartsOn).toBeUndefined();
		});

		it('should have weeks with sequential indices', () => {
			const birthDate = new Date(2000, 0, 1);
			const result = generateCalendarData(birthDate, 1, 'TestComponent');

			result.weeks.forEach((week, index) => {
				expect(week.index).toBe(index);
				expect(week.startDate).toBeInstanceOf(Date);
			});
		});

		it('should have weeks in chronological order', () => {
			const birthDate = new Date(2000, 0, 1);
			const result = generateCalendarData(birthDate, 1, 'TestComponent');

			for (let i = 1; i < result.weeks.length; i++) {
				expect(result.weeks[i].startDate.getTime()).toBeGreaterThan(
					result.weeks[i - 1].startDate.getTime(),
				);
			}
		});

		it('should have hasWeeks as true when weeks exist', () => {
			const birthDate = new Date(2000, 0, 1);
			const result = generateCalendarData(birthDate, 1, 'TestComponent');

			expect(result.hasWeeks).toBe(true);
			expect(result.weeks.length).toBeGreaterThan(0);
		});

		it('should handle birthWeek being before birthDate', () => {
			const birthDate = new Date(2000, 0, 5); // Wednesday, Jan 5
			const result = generateCalendarData(
				birthDate,
				1,
				'TestComponent',
				'Monday',
			);

			// Birth week should be Monday, Jan 3
			expect(result.birthWeek.getTime()).toBeLessThanOrEqual(
				birthDate.getTime(),
			);
			expect(result.birthWeek.getDay()).toBe(1); // Monday
		});
	});

	describe('createYearGroups', () => {
		it('should create year groups with valid inputs', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const validatedLifespan = 20;
			const validatedWeekStartsOn = 1;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				validatedWeekStartsOn,
			);

			// 20 years / 10 years per group = 2 groups
			expect(result.length).toBe(2);
			expect(Array.isArray(result[0])).toBe(true);
			expect(Array.isArray(result[1])).toBe(true);
		});

		it('should create correct number of groups', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const validatedLifespan = 25; // Should create 3 groups (10+10+5)
			const validatedWeekStartsOn = 1;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				validatedWeekStartsOn,
			);

			expect(result.length).toBe(3);
		});

		it('should create single group for lifespan less than year group size', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const validatedLifespan = 5; // Less than YEAR_GROUP_SIZE (10)
			const validatedWeekStartsOn = 1;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				validatedWeekStartsOn,
			);

			expect(result.length).toBe(1);
		});

		it('should create groups with weeks having sequential indices within group', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const validatedLifespan = 10;
			const validatedWeekStartsOn = 1;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				validatedWeekStartsOn,
			);

			result.forEach((group) => {
				group.forEach((week, index) => {
					expect(week.index).toBe(index);
					expect(week.startDate).toBeInstanceOf(Date);
				});
			});
		});

		it('should have weeks in chronological order within each group', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const validatedLifespan = 20;
			const validatedWeekStartsOn = 1;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				validatedWeekStartsOn,
			);

			result.forEach((group) => {
				for (let i = 1; i < group.length; i++) {
					expect(group[i].startDate.getTime()).toBeGreaterThan(
						group[i - 1].startDate.getTime(),
					);
				}
			});
		});

		it('should return empty array for invalid birthDate', () => {
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			const result = createYearGroups(
				null as any,
				80,
				new Date(1990, 0, 1),
				1,
			);

			expect(result).toEqual([]);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid parameters for year grouping'),
			);

			consoleSpy.mockRestore();
		});

		it('should return empty array for invalid lifespan (zero)', () => {
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			const result = createYearGroups(
				new Date(1990, 0, 1),
				0,
				new Date(1990, 0, 1),
				1,
			);

			expect(result).toEqual([]);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid parameters for year grouping'),
			);

			consoleSpy.mockRestore();
		});

		it('should return empty array for negative lifespan', () => {
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			const result = createYearGroups(
				new Date(1990, 0, 1),
				-10,
				new Date(1990, 0, 1),
				1,
			);

			expect(result).toEqual([]);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid parameters for year grouping'),
			);

			consoleSpy.mockRestore();
		});

		it('should handle undefined weekStartsOn', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate);
			const validatedLifespan = 10;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				undefined,
			);

			expect(result.length).toBe(1);
			expect(result[0].length).toBeGreaterThan(0);
		});

		it('should handle different weekStartsOn values', () => {
			const validatedBirthDate = new Date(2000, 0, 5); // Wednesday
			const birthWeekMonday = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const birthWeekSunday = startOfWeek(validatedBirthDate, {
				weekStartsOn: 0,
			});
			const validatedLifespan = 10;

			const resultMonday = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeekMonday,
				1,
			);

			const resultSunday = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeekSunday,
				0,
			);

			expect(resultMonday[0][0].startDate.getDay()).toBe(1); // Monday
			expect(resultSunday[0][0].startDate.getDay()).toBe(0); // Sunday
		});

		it('should have each group cover approximately YEAR_GROUP_SIZE years', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const validatedLifespan = 20;
			const validatedWeekStartsOn = 1;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				validatedWeekStartsOn,
			);

			// First group should have approximately 10 years * 52 weeks = ~520 weeks
			expect(result[0].length).toBeGreaterThanOrEqual(500);
			expect(result[0].length).toBeLessThanOrEqual(540);
		});

		it('should handle exact multiple of YEAR_GROUP_SIZE', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const validatedLifespan = CALENDAR_LAYOUT.YEAR_GROUP_SIZE; // Exactly 10 years
			const validatedWeekStartsOn = 1;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				validatedWeekStartsOn,
			);

			expect(result.length).toBe(1);
		});

		it('should handle large lifespans', () => {
			const validatedBirthDate = new Date(1990, 0, 1);
			const birthWeek = startOfWeek(validatedBirthDate, {
				weekStartsOn: 1,
			});
			const validatedLifespan = 100;
			const validatedWeekStartsOn = 1;

			const result = createYearGroups(
				validatedBirthDate,
				validatedLifespan,
				birthWeek,
				validatedWeekStartsOn,
			);

			// 100 years / 10 years per group = 10 groups
			expect(result.length).toBe(10);
		});
	});
});
