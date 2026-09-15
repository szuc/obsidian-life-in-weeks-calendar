<script lang="ts">
	import CalendarBasic from './CalendarBasic.svelte';
	import CalendarYearly from './CalendarYearly.svelte';
	import { createLocalDateYYYYMMDD, updateToday } from '../lib/utils';
	import { App, TFile } from 'obsidian';

	const {
		birthdate,
		projectedLifespan,
		calendarMode,
		modalFn,
		weekStartsOn,
		folderPath,
		fileNamePattern,
		allWeeklyNotes,
		templatePath,
		syncWithJournalNotes,
		app,
	}: {
		birthdate: string;
		projectedLifespan: string;
		calendarMode: string;
		modalFn: ((message: string, cb: () => void) => void) | undefined;
		weekStartsOn: string;
		allWeeklyNotes: Record<string, TFile> | undefined;
		folderPath: string;
		fileNamePattern: string;
		templatePath: string;
		syncWithJournalNotes: boolean;
		app: App;
	} = $props();

	/**
	 * Parse birth date string into a Date object in local timezone
	 * Prevents timezone offset issues by parsing components manually
	 */
	let birthDate = $derived.by(() => createLocalDateYYYYMMDD(birthdate));

	/** Convert lifespan string to number for calculations */
	let lifespan = $derived(Number(projectedLifespan));

	/** Update the current date reference before each render */
	$effect(() => {
		updateToday();
	});
</script>

<div class="life-in-weeks-calendar-plugin">
	{#if calendarMode === 'yearly'}
		<CalendarYearly
			{birthDate}
			{lifespan}
			{allWeeklyNotes}
			{modalFn}
			{weekStartsOn}
			{folderPath}
			{fileNamePattern}
			{templatePath}
			{syncWithJournalNotes}
			{app}
		/>
	{:else}
		<CalendarBasic
			{birthDate}
			{lifespan}
			{allWeeklyNotes}
			{modalFn}
			{weekStartsOn}
			{folderPath}
			{fileNamePattern}
			{templatePath}
			{syncWithJournalNotes}
			{app}
		/>
	{/if}
</div>
