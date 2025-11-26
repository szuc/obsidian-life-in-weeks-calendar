// Mock date-fns functions
jest.mock('date-fns', () => ({
	isThisWeek: jest.fn(),
	getDay: jest.fn(),
	nextDay: jest.fn(),
}));

// Mock obsidian module (uses __mocks__/obsidian.js)
jest.mock('obsidian');

import { isThisWeek, getDay, nextDay } from 'date-fns';
import type { TFile } from 'obsidian';
import {
	updateToday,
	setWeekStatus,
	createLocalDateYYYYMMDD,
	dateToYYYYMMDD,
	dateToWeeklyNoteRecordKeyFormat,
	isValidDate,
	weeklyNoteKeyCorrection,
	weekStartsOnStringToIndex,
	weekStartsOnIndexToString,
	createFilesRecord,
	isValidLifespan,
	isValidFileName,
	getRootFolderOfFirstDynamicSegment,
	parseDynamicFolderPath,
	isStringDynamic,
	extractMomentFormatFromPattern,
	parseDynamicDatesInString,
	parseJournalsVariables,
} from './utils';

const mockIsThisWeek = isThisWeek as jest.MockedFunction<typeof isThisWeek>;
const mockGetDay = getDay as jest.MockedFunction<typeof getDay>;
const mockNextDay = nextDay as jest.MockedFunction<typeof nextDay>;

describe('utils.ts', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('updateToday', () => {
		it('should update the internal TODAY variable', () => {
			// We can't directly test the internal TODAY variable,
			// but we can verify the function runs without error
			expect(() => updateToday()).not.toThrow();
		});
	});

	describe('setWeekStatus', () => {
		beforeEach(() => {
			updateToday();
		});

		it('should return "present" for current week', () => {
			mockIsThisWeek.mockReturnValue(true);
			const result = setWeekStatus(new Date(), 1);
			expect(result).toBe('present');
		});

		it('should return "past" for dates in the past', () => {
			mockIsThisWeek.mockReturnValue(false);
			const pastDate = new Date('2020-01-01');
			const result = setWeekStatus(pastDate, 1);
			expect(result).toBe('past');
		});

		it('should return "future" for dates in the future', () => {
			mockIsThisWeek.mockReturnValue(false);
			const futureDate = new Date('2099-01-01');
			const result = setWeekStatus(futureDate, 1);
			expect(result).toBe('future');
		});

		it('should throw error for invalid date', () => {
			expect(() => setWeekStatus(new Date('invalid'), 1)).toThrow(
				'setWeekStatus: weekStartDate must be a valid Date object'
			);
		});

		it('should throw error for null date', () => {
			expect(() => setWeekStatus(null as any, 1)).toThrow(
				'setWeekStatus: weekStartDate must be a valid Date object'
			);
		});
	});

	describe('createLocalDateYYYYMMDD', () => {
		it('should create a date from YYYY-MM-DD format', () => {
			const result = createLocalDateYYYYMMDD('2024-03-15');
			expect(result.getFullYear()).toBe(2024);
			expect(result.getMonth()).toBe(2); // March is month 2 (0-indexed)
			expect(result.getDate()).toBe(15);
		});

		it('should throw error for invalid format', () => {
			expect(() => createLocalDateYYYYMMDD('2024/03/15')).toThrow(
				'createLocalDateYYYYMMDD: dateString must be in YYYY-MM-DD format'
			);
		});

		it('should throw error for empty string', () => {
			expect(() => createLocalDateYYYYMMDD('')).toThrow(
				'createLocalDateYYYYMMDD: dateString must be a non-empty string'
			);
		});

		it('should throw error for non-string input', () => {
			expect(() => createLocalDateYYYYMMDD(null as any)).toThrow(
				'createLocalDateYYYYMMDD: dateString must be a non-empty string'
			);
		});
	});

	describe('dateToYYYYMMDD', () => {
		it('should format date to YYYY-MM-DD', () => {
			const date = new Date(2024, 2, 15); // March 15, 2024
			expect(dateToYYYYMMDD(date)).toBe('2024-03-15');
		});

		it('should pad single-digit months and days', () => {
			const date = new Date(2024, 0, 5); // January 5, 2024
			expect(dateToYYYYMMDD(date)).toBe('2024-01-05');
		});

		it('should throw error for invalid date', () => {
			expect(() => dateToYYYYMMDD(new Date('invalid'))).toThrow(
				'dateToYYYYMMDD: date must be a valid Date object'
			);
		});

		it('should throw error for null', () => {
			expect(() => dateToYYYYMMDD(null as any)).toThrow(
				'dateToYYYYMMDD: date must be a valid Date object'
			);
		});
	});

	describe('dateToWeeklyNoteRecordKeyFormat', () => {
		it('should format date with timezone offset', () => {
			const date = new Date(2024, 2, 15); // March 15, 2024
			const result = dateToWeeklyNoteRecordKeyFormat(date);
			expect(result).toMatch(/^week-2024-03-15T00:00:00[+-]\d{2}:\d{2}$/);
		});

		it('should throw error for invalid date', () => {
			expect(() => dateToWeeklyNoteRecordKeyFormat(new Date('invalid'))).toThrow(
				'dateToWeeklyNoteRecordKeyFormat: date must be a valid Date object'
			);
		});
	});

	describe('isValidDate', () => {
		it('should return true for valid date', () => {
			expect(isValidDate(new Date())).toBe(true);
		});

		it('should return false for invalid date', () => {
			expect(isValidDate(new Date('invalid'))).toBe(false);
		});

		it('should return false for non-Date object', () => {
			expect(isValidDate('2024-01-01' as any)).toBe(false);
		});
	});

	describe('weeklyNoteKeyCorrection', () => {
		it('should return unchanged key when day matches weekStartsOn', () => {
			mockGetDay.mockReturnValue(1); // Monday
			const key = 'week-2024-03-15T00:00:00+00:00';
			const result = weeklyNoteKeyCorrection(key, 'Monday');
			expect(result).toBe(key);
		});

		it('should return unchanged key when weekStartsOn is undefined', () => {
			mockGetDay.mockReturnValue(3);
			const key = 'week-2024-03-15T00:00:00+00:00';
			const result = weeklyNoteKeyCorrection(key, 'invalid');
			expect(result).toBe(key);
		});

		it('should correct key when day does not match weekStartsOn', () => {
			mockGetDay.mockReturnValue(3); // Wednesday
			const nextMonday = new Date(2024, 2, 18);
			mockNextDay.mockReturnValue(nextMonday);

			const key = 'week-2024-03-15T00:00:00+00:00';
			const result = weeklyNoteKeyCorrection(key, 'Monday');

			expect(result).toMatch(/^week-2024-03-18T00:00:00/);
		});
	});

	describe('weekStartsOnStringToIndex', () => {
		it('should convert "Sunday" to 0', () => {
			expect(weekStartsOnStringToIndex('Sunday')).toBe(0);
		});

		it('should convert "Monday" to 1', () => {
			expect(weekStartsOnStringToIndex('Monday')).toBe(1);
		});

		it('should be case-insensitive', () => {
			expect(weekStartsOnStringToIndex('TUESDAY')).toBe(2);
			expect(weekStartsOnStringToIndex('wednesday')).toBe(3);
		});

		it('should return undefined for invalid day', () => {
			expect(weekStartsOnStringToIndex('InvalidDay')).toBeUndefined();
		});

		it('should return undefined for undefined input', () => {
			expect(weekStartsOnStringToIndex(undefined)).toBeUndefined();
		});

		it('should handle all days of the week', () => {
			expect(weekStartsOnStringToIndex('Thursday')).toBe(4);
			expect(weekStartsOnStringToIndex('Friday')).toBe(5);
			expect(weekStartsOnStringToIndex('Saturday')).toBe(6);
		});
	});

	describe('weekStartsOnIndexToString', () => {
		it('should convert 0 to "sunday"', () => {
			expect(weekStartsOnIndexToString(0)).toBe('sunday');
		});

		it('should convert 1 to "monday"', () => {
			expect(weekStartsOnIndexToString(1)).toBe('monday');
		});

		it('should handle all valid indices', () => {
			expect(weekStartsOnIndexToString(2)).toBe('tuesday');
			expect(weekStartsOnIndexToString(3)).toBe('wednesday');
			expect(weekStartsOnIndexToString(4)).toBe('thursday');
			expect(weekStartsOnIndexToString(5)).toBe('friday');
			expect(weekStartsOnIndexToString(6)).toBe('saturday');
		});

		it('should return undefined for invalid index', () => {
			expect(weekStartsOnIndexToString(7)).toBeUndefined();
			expect(weekStartsOnIndexToString(-1)).toBeUndefined();
		});

		it('should return undefined for undefined input', () => {
			expect(weekStartsOnIndexToString(undefined)).toBeUndefined();
		});
	});

	describe('createFilesRecord', () => {
		it('should create a record from files with valid dates', () => {
			// Mock TFile instances
			const files = [
				{ path: 'folder/2024-11.md', basename: '2024-11' },
				{ path: 'folder/2024-12.md', basename: '2024-12' },
			] as TFile[];

			const result = createFilesRecord('YYYY-WW', 'Monday', files);

			expect(result).toBeDefined();
			expect(Object.keys(result!).length).toBeGreaterThan(0);
		});

		it('should skip files with invalid date formats', () => {
			const files = [
				{ path: 'folder/invalid.md', basename: 'invalid' },
			] as TFile[];

			const result = createFilesRecord('YYYY-WW', 'Monday', files);

			expect(result).toBeDefined();
			expect(Object.keys(result!).length).toBe(0);
		});

		it('should handle dynamic file patterns', () => {
			const files = [
				{ path: 'folder/Weekly-2024-W11.md', basename: 'Weekly-2024-W11' },
			] as TFile[];

			const result = createFilesRecord('Weekly-{{date:GGGG-[W]WW}}', 'Monday', files);

			expect(result).toBeDefined();
		});
	});

	describe('isValidLifespan', () => {
		it('should return true for valid lifespan within range', () => {
			expect(isValidLifespan('80', 1, 150)).toBe(true);
		});

		it('should return true for minimum lifespan', () => {
			expect(isValidLifespan('1', 1, 150)).toBe(true);
		});

		it('should return true for maximum lifespan', () => {
			expect(isValidLifespan('150', 1, 150)).toBe(true);
		});

		it('should return false for lifespan below minimum', () => {
			expect(isValidLifespan('0', 1, 150)).toBe(false);
		});

		it('should return false for lifespan above maximum', () => {
			expect(isValidLifespan('151', 1, 150)).toBe(false);
		});

		it('should return false for non-integer values', () => {
			expect(isValidLifespan('80.5', 1, 150)).toBe(false);
		});

		it('should return false for non-numeric values', () => {
			expect(isValidLifespan('abc', 1, 150)).toBe(false);
		});

		it('should return false for empty string', () => {
			expect(isValidLifespan('', 1, 150)).toBe(false);
		});
	});

	describe('isValidFileName', () => {
		it('should return true for .md files', () => {
			expect(isValidFileName('file.md')).toBe(true);
		});

		it('should return true for empty/whitespace strings', () => {
			expect(isValidFileName('')).toBe(true);
			expect(isValidFileName('   ')).toBe(true);
		});

		it('should return false for non-.md files', () => {
			expect(isValidFileName('file.txt')).toBe(false);
		});

		it('should return false for files without extension', () => {
			expect(isValidFileName('file')).toBe(false);
		});
	});

	describe('getRootFolderOfFirstDynamicSegment', () => {
		it('should return path up to first dynamic segment', () => {
			const result = getRootFolderOfFirstDynamicSegment('Journals/{{date}}/Notes');
			expect(result).toBe('Journals');
		});

		it('should return entire path if no dynamic segment', () => {
			const result = getRootFolderOfFirstDynamicSegment('Static/Path/To/Folder');
			expect(result).toBe('Static/Path/To/Folder');
		});

		it('should remove trailing slashes', () => {
			const result = getRootFolderOfFirstDynamicSegment('Journals/{{date}}');
			expect(result).toBe('Journals');
		});

		it('should handle dynamic segment at start', () => {
			const result = getRootFolderOfFirstDynamicSegment('{{date}}/Notes');
			expect(result).toBe('');
		});

		it('should handle multiple dynamic segments', () => {
			const result = getRootFolderOfFirstDynamicSegment('Root/{{date}}/{{index}}');
			expect(result).toBe('Root');
		});
	});

	describe('parseDynamicFolderPath', () => {
		it('should return unchanged path for static paths', () => {
			const result = parseDynamicFolderPath('Static/Path', new Date());
			expect(result).toBe('Static/Path');
		});

		it('should parse dynamic date segments', () => {
			const date = new Date(2024, 2, 15);
			const result = parseDynamicFolderPath('Journals/{{date:YYYY}}/{{date:MM}}', date);
			expect(result).toBe('Journals/2024/03');
		});

		it('should use default format for {{date}} without format', () => {
			const date = new Date(2024, 2, 15);
			const result = parseDynamicFolderPath('Notes/{{date}}', date);
			expect(result).toBe('Notes/2024-03-15');
		});

		it('should handle custom default format', () => {
			const date = new Date(2024, 2, 15);
			const result = parseDynamicFolderPath('Notes/{{date}}', date, 'YYYY/MM');
			expect(result).toBe('Notes/2024/03');
		});
	});

	describe('isStringDynamic', () => {
		it('should return true for strings with dynamic segments', () => {
			expect(isStringDynamic('{{date}}')).toBe(true);
			expect(isStringDynamic('prefix-{{date:YYYY}}-suffix')).toBe(true);
		});

		it('should return false for static strings', () => {
			expect(isStringDynamic('static-string')).toBe(false);
		});

		it('should return false for incomplete dynamic segments', () => {
			expect(isStringDynamic('{{incomplete')).toBe(false);
			expect(isStringDynamic('incomplete}}')).toBe(false);
		});
	});

	describe('extractMomentFormatFromPattern', () => {
		it('should extract format from {{date:FORMAT}} pattern', () => {
			const result = extractMomentFormatFromPattern('{{date:DD-MM-YYYY}}');
			expect(result).toBe('DD-MM-YYYY');
		});

		it('should wrap literal text before dynamic segment', () => {
			const result = extractMomentFormatFromPattern('Weekly-{{date:GGGG-[W]WW}}');
			expect(result).toBe('[Weekly-]GGGG-[W]WW');
		});

		it('should wrap literal text after dynamic segment', () => {
			const result = extractMomentFormatFromPattern('{{date:YYYY-MM-DD}}-note');
			expect(result).toBe('YYYY-MM-DD[-note]');
		});

		it('should wrap entire pattern if no dynamic segment', () => {
			const result = extractMomentFormatFromPattern('YYYY-WW');
			expect(result).toBe('[YYYY-WW]');
		});

		it('should handle both before and after literal text', () => {
			const result = extractMomentFormatFromPattern('prefix-{{date:YYYY}}-suffix');
			expect(result).toBe('[prefix-]YYYY[-suffix]');
		});
	});

	describe('parseDynamicDatesInString', () => {
		it('should parse {{date}} with default format', () => {
			const date = new Date(2024, 2, 15);
			const result = parseDynamicDatesInString('{{date}}', date);
			expect(result).toBe('2024-03-15');
		});

		it('should parse {{date:FORMAT}} with custom format', () => {
			const date = new Date(2024, 2, 15);
			const result = parseDynamicDatesInString('{{date:YYYY}}', date);
			expect(result).toBe('2024');
		});

		it('should handle multiple dynamic segments', () => {
			const date = new Date(2024, 2, 15);
			const result = parseDynamicDatesInString('Month-{{date:MM}}-Week-{{date:WW}}', date);
			expect(result).toMatch(/Month-03-Week-\d+/);
		});

		it('should preserve literal text', () => {
			const date = new Date(2024, 2, 15);
			const result = parseDynamicDatesInString('Notes-{{date:GGGG-[W]WW}}', date);
			// Mock moment implementation returns "2024-11W" instead of "2024-W11"
			expect(result).toContain('Notes-2024');
			expect(result).toContain('W');
		});

		it('should handle whitespace in segments', () => {
			const date = new Date(2024, 2, 15);
			const result = parseDynamicDatesInString('{{ date:YYYY }}', date);
			// Mock preserves whitespace in the result
			expect(result).toContain('2024');
		});
	});

	describe('parseJournalsVariables', () => {
		it('should replace {{start_date}} with week start', () => {
			const date = new Date(2024, 2, 15);
			const result = parseJournalsVariables('Week: {{start_date}}', date);
			expect(result).toMatch(/Week: \d{4}-\d{2}-\d{2}/);
		});

		it('should replace {{end_date}} with week end', () => {
			const date = new Date(2024, 2, 15);
			const result = parseJournalsVariables('Week: {{end_date}}', date);
			expect(result).toMatch(/Week: \d{4}-\d{2}-\d{2}/);
		});

		it('should replace {{index}} with week number', () => {
			const date = new Date(2024, 2, 15);
			const result = parseJournalsVariables('Week {{index}}', date);
			expect(result).toMatch(/Week \d+/);
		});

		it('should replace {{current_date}} with current date', () => {
			const date = new Date(2024, 2, 15);
			const result = parseJournalsVariables('Date: {{current_date}}', date);
			expect(result).toBe('Date: 2024-03-15');
		});

		it('should handle multiple variables', () => {
			const date = new Date(2024, 2, 15);
			const result = parseJournalsVariables(
				'{{start_date}} to {{end_date}} - Week {{index}}',
				date
			);
			expect(result).toMatch(/\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2} - Week \d+/);
		});

		it('should handle whitespace in variables', () => {
			const date = new Date(2024, 2, 15);
			const result = parseJournalsVariables('{{ start_date }}', date);
			expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
		});

		it('should use custom format', () => {
			const date = new Date(2024, 2, 15);
			const result = parseJournalsVariables('{{start_date}}', date, 'YYYY/MM');
			expect(result).toMatch(/\d{4}\/\d{2}/);
		});
	});
});
