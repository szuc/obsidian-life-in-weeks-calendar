<script lang="ts">
	import CalendarBasic from './CalendarBasic.svelte';
	import CalendarYearly from './CalendarYearly.svelte';
	import { createLocalDateYYYYMMDD } from '../lib/utils';
	import type { CalendarMode } from 'src/lib/types';
	import { TFile } from 'obsidian';
	import {
		appHasDailyNotesPluginLoaded,
		getAllWeeklyNotes,
	} from 'obsidian-daily-notes-interface';

	const {
		birthdate,
		projectedLifespan,
		calendarMode,
		modalFn,
		syncWithWeeklyNotes,
		weekStartsOn,
	}: {
		birthdate: string;
		projectedLifespan: string;
		calendarMode: string;
		modalFn: ((message: string, cb: () => void) => void) | undefined;
		syncWithWeeklyNotes: boolean;
		weekStartsOn: string | undefined;
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

	let allWeeklyNotes: Record<string, TFile> | undefined = $state(undefined);
	if (appHasDailyNotesPluginLoaded() && syncWithWeeklyNotes) {
		// gets a record of all the weekly notes <"date_string", TFile>
		allWeeklyNotes = getAllWeeklyNotes();
	}
	export function refreshWeeklyNotes() {
		if (appHasDailyNotesPluginLoaded() && syncWithWeeklyNotes) {
			allWeeklyNotes = getAllWeeklyNotes();
		}
	}
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
		/>
	{:else}
		<CalendarBasic
			{birthDate}
			{lifespan}
			{allWeeklyNotes}
			{modalFn}
			{syncWithWeeklyNotes}
			{weekStartsOn}
		/>
	{/if}
</div>
