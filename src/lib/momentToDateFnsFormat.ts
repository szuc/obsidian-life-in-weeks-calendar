// momentToDateFnsFormat.ts

const momentToDateFnsMap: Record<string, string> = {
	// Year
	YYYY: 'yyyy',
	YY: 'yy',

	// Month
	M: 'M',
	MM: 'MM',
	MMM: 'MMM',
	MMMM: 'MMMM',

	// Day of Month
	D: 'd',
	DD: 'dd',

	// Day of Year
	DDD: 'D',
	DDDD: 'DDD',

	// Day of Week (locale)
	e: 'e', // 0 (Sunday) - 6 (Saturday), date-fns: local day of week (numeric)
	ddd: 'eee', // Abbreviated day name, locale
	dddd: 'eeee', // Full day name, locale

	// Day of Week (ISO)
	E: 'i', // 1 (Monday) - 7 (Sunday), date-fns: ISO day of week (numeric)

	// Week of Year (locale)
	w: 'w', // Week of year (locale)
	ww: 'ww', // Padded week of year (locale)

	// Week Year (locale)
	gggg: 'yyyy', // No direct equivalent, fallback to year
	gg: 'yy', // No direct equivalent, fallback to 2-digit year

	// Week of Year (ISO)
	W: 'I', // ISO week of year
	WW: 'II', // ISO week of year, padded

	// ISO Week Year
	GGGG: 'RRRR', // ISO week-numbering year (4-digit)
	GG: 'RR', // ISO week-numbering year (2-digit)

	// AM/PM
	A: 'a',
	a: 'aaa',

	// Hour
	H: 'H',
	HH: 'HH',
	h: 'h',
	hh: 'hh',

	// Minute
	m: 'm',
	mm: 'mm',

	// Second
	s: 's',
	ss: 'ss',

	// Fractional seconds
	S: 'S',
	SS: 'SS',
	SSS: 'SSS',

	// Timezone
	Z: 'XXX',
	ZZ: 'xx',
};

const momentTokenRegex =
	/\[[^\]]*]|GGGG|GG|gggg|gg|WW|W|ww|w|dddd|ddd|dd|d|MMMM|MMM|MM|M|YYYY|YY|DDDD|DDD|DD|D|HH|H|hh|h|mm|m|ss|s|SSS|SS|S|A|a|ZZ|Z|E|e|./g;

/**
 * Converts a Moment.js format string to a date-fns format string.
 * @param momentFormat Moment.js format string
 * @returns date-fns format string
 */
export function momentToDateFnsFormat(momentFormat: string): string {
	return momentFormat.replace(momentTokenRegex, (token) => {
		// Handle literals in square brackets
		if (token.startsWith('[') && token.endsWith(']')) {
			// date-fns uses single quotes for literals
			return `'${token.slice(1, -1).replace(/'/g, "''")}'`;
		}
		// Map token
		const mapped = momentToDateFnsMap[token];
		if (mapped) return mapped;
		// If not mapped, return token as-is (or throw/warn)
		console.error(`Unable to parse moment token: ${token}`);
		return token;
	});
}
