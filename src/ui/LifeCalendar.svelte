<script lang="ts">
	import CalendarBasic from './CalendarBasic.svelte';
	import CalendarYearly from './CalendarYearly.svelte';
	import { createLocalDateYYYYMMDD } from '../lib/utils';
	import type { CalendarMode } from 'src/lib/types';
	import { App, TFile } from 'obsidian';

	const {
		birthdate,
		projectedLifespan,
		calendarMode,
		modalFn,
		syncWithWeeklyNotes,
		weekStartsOn,
		allWeeklyNotes,
		app,
	}: {
		birthdate: string;
		projectedLifespan: string;
		calendarMode: string;
		modalFn: ((message: string, cb: () => void) => void) | undefined;
		syncWithWeeklyNotes: boolean;
		weekStartsOn: string | undefined;
		allWeeklyNotes: Record<string, TFile> | undefined;
		app: App;
	} = $props();

	let mode: CalendarMode = $state(calendarMode as CalendarMode);
	let birthDateString = $state(birthdate);
	let lifespanString = $state(projectedLifespan);

	/**
	 * Parse birth date string into a Date object in local timezone
	 * Prevents timezone offset issues by parsing components manually
	 */
	let birthDate = $derived.by(() => createLocalDateYYYYMMDD(birthDateString));

	/** Convert lifespan string to number for calculations */
	let lifespan = $derived(Number(lifespanString));
</script>

<div class="life-in-weeks-calendar-plugin">
	{#if mode === 'yearly'}
		<CalendarYearly
			{birthDate}
			{lifespan}
			{allWeeklyNotes}
			{modalFn}
			{syncWithWeeklyNotes}
			{weekStartsOn}
			{app}
		/>
	{:else}
		<CalendarBasic
			{birthDate}
			{lifespan}
			{allWeeklyNotes}
			{modalFn}
			{syncWithWeeklyNotes}
			{weekStartsOn}
			{app}
		/>
	{/if}
</div>
