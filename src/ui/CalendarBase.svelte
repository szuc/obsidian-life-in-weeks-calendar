<script lang="ts">
	import type { CalendarData } from 'src/lib/types';
	import type { Snippet } from 'svelte';
	import generateCalendarData from '../lib/generateCalendarData';

	interface Props {
		birthDate: Date;
		lifespan: number;
		componentName: string;
		children: Snippet<[CalendarData | null]>;
	}

	let { birthDate, lifespan, componentName, children }: Props = $props();

	// Generate all calendar data using shared utilities
	const calendarData = $derived.by(() => {
		try {
			return generateCalendarData(birthDate, lifespan, componentName);
		} catch (err) {
			console.error(err);
			return null;
		}
	});
</script>

<!-- 
	Render children with all calculated data
	Provides all calculated data to child components via properly typed CalendarData
-->
{@render children(calendarData)}
