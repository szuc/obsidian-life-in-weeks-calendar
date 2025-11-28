// @ts-nocheck
// Manual mock for obsidian module
// Note: This file intentionally uses CommonJS format.
// Jest manual mocks in __mocks__ folders require CommonJS format by default.
const momentMock = (date, _format, _strict) => {
	const jsDate =
		date instanceof Date ? date : date ? new Date(date) : new Date();
	return {
		format: (formatStr) => {
			const year = jsDate.getFullYear();
			const month = String(jsDate.getMonth() + 1).padStart(2, '0');
			const day = String(jsDate.getDate()).padStart(2, '0');
			const offset = jsDate.getTimezoneOffset();
			const sign = offset > 0 ? '-' : '+';
			const absOffset = Math.abs(offset);
			const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
			const minutes = String(absOffset % 60).padStart(2, '0');

			return formatStr
				.replace(/YYYY/g, String(year))
				.replace(/MM/g, month)
				.replace(/DD/g, day)
				.replace(/Z/g, `${sign}${hours}:${minutes}`)
				.replace(/\[week-\]/g, 'week-')
				.replace(/\[Weekly-\]/g, 'Weekly-')
				.replace(/GGGG/g, String(year))
				.replace(/gggg/g, String(year))
				.replace(/WW/g, '11')
				.replace(/ww/g, '11')
				.replace(/\[W\]/g, 'W');
		},
		isValid: () => !isNaN(jsDate.getTime()),
		startOf: (unit) => {
			const newDate = new Date(jsDate);
			if (unit === 'week') {
				const day = newDate.getDay();
				newDate.setDate(newDate.getDate() - day);
			}
			return momentMock(newDate);
		},
		endOf: (unit) => {
			const newDate = new Date(jsDate);
			if (unit === 'week') {
				const day = newDate.getDay();
				newDate.setDate(newDate.getDate() + (6 - day));
			}
			return momentMock(newDate);
		},
		week: () => {
			const start = new Date(jsDate.getFullYear(), 0, 1);
			const diff = jsDate.getTime() - start.getTime();
			const oneWeek = 1000 * 60 * 60 * 24 * 7;
			return Math.ceil(diff / oneWeek);
		},
	};
};

class TFile {
	constructor(path, basename) {
		this.path = path;
		this.basename = basename;
	}
}

/**
 * Mock implementation of Obsidian's normalizePath function.
 * Normalizes a path by:
 * - Converting backslashes to forward slashes
 * - Removing duplicate slashes
 * - Removing leading/trailing slashes
 */
const normalizePath = (path) => {
	if (!path || typeof path !== 'string') return '';

	return path
		.replace(/\\/g, '/') // Convert backslashes to forward slashes
		.replace(/\/+/g, '/') // Remove duplicate slashes
		.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
};

module.exports = {
	moment: momentMock,
	TFile: TFile,
	normalizePath: normalizePath,
};
