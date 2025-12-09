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

			// Time components
			const hour24 = jsDate.getHours();
			const hour12 = hour24 % 12 || 12;
			const minute = String(jsDate.getMinutes()).padStart(2, '0');
			const second = String(jsDate.getSeconds()).padStart(2, '0');
			const ampm = hour24 < 12 ? 'AM' : 'PM';
			const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][jsDate.getDay()];
			const dayOfWeekShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][jsDate.getDay()];
			const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			const monthName = monthNames[jsDate.getMonth()];
			const monthNameShort = monthNamesShort[jsDate.getMonth()];

			// Ordinal suffix for day
			const getOrdinal = (n) => {
				const s = ['th', 'st', 'nd', 'rd'];
				const v = n % 100;
				return n + (s[(v - 20) % 10] || s[v] || s[0]);
			};

			// Token mapping - order matters: longer tokens first to avoid partial matches
			const tokens = [
				// Literal brackets first
				{ pattern: /\[week-\]/g, value: 'week-' },
				{ pattern: /\[Weekly-\]/g, value: 'Weekly-' },
				{ pattern: /\[W\]/g, value: 'W' },
				// Longer tokens before shorter
				{ pattern: /MMMM/g, value: monthName },
				{ pattern: /MMM/g, value: monthNameShort },
				{ pattern: /dddd/g, value: dayOfWeek },
				{ pattern: /ddd/g, value: dayOfWeekShort },
				{ pattern: /YYYY/g, value: String(year) },
				{ pattern: /GGGG/g, value: String(year) },
				{ pattern: /gggg/g, value: String(year) },
				{ pattern: /Do/g, value: getOrdinal(jsDate.getDate()) },
				{ pattern: /DD/g, value: day },
				{ pattern: /MM/g, value: month },
				{ pattern: /HH/g, value: String(hour24).padStart(2, '0') },
				{ pattern: /hh/g, value: String(hour12).padStart(2, '0') },
				{ pattern: /mm/g, value: minute },
				{ pattern: /ss/g, value: second },
				{ pattern: /WW/g, value: '11' },
				{ pattern: /ww/g, value: '11' },
				{ pattern: /D/g, value: String(jsDate.getDate()) },
				{ pattern: /M/g, value: String(jsDate.getMonth() + 1) },
				{ pattern: /H/g, value: String(hour24) },
				{ pattern: /h/g, value: String(hour12) },
				{ pattern: /m/g, value: String(jsDate.getMinutes()) },
				{ pattern: /s/g, value: String(jsDate.getSeconds()) },
				{ pattern: /A/g, value: ampm },
				{ pattern: /a/g, value: ampm.toLowerCase() },
				{ pattern: /Z/g, value: `${sign}${hours}:${minutes}` }
			];

			// Use placeholders for atomic replacement
			const placeholders = [];
			let result = formatStr;

			// Step 1: Replace all tokens with unique placeholders
			tokens.forEach((token, index) => {
				const placeholder = `\x00${index}\x00`; // Use null bytes as delimiters
				result = result.replace(token.pattern, () => {
					placeholders[index] = token.value;
					return placeholder;
				});
			});

			// Step 2: Replace placeholders with actual values
			tokens.forEach((_, index) => {
				if (placeholders[index] !== undefined) {
					const placeholder = `\x00${index}\x00`;
					result = result.replace(new RegExp(placeholder, 'g'), placeholders[index]);
				}
			});

			return result;
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
