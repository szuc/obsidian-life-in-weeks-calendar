<script lang="ts">
	import CalendarBase from './CalendarBase.svelte';
	import WeekBlock from './WeekBlock.svelte';
	import CalendarError from './CalendarError.svelte';
	import { TFile } from 'obsidian';
	import { openWeeklyNoteFunction } from 'src/lib/openWeeklyNote';
	import {
		dateToDailyNoteFormatRecordKey,
		setWeekStatus,
	} from '../lib/utils';

	let {
		birthDate,
		lifespan,
		allWeeklyNotes,
		modalFn,
		syncWithWeeklyNotes,
		weekStartsOn,
	}: {
		birthDate: Date;
		lifespan: number;
		allWeeklyNotes: Record<string, TFile> | undefined;
		modalFn: ((message: string, cb: () => void) => void) | undefined;
		syncWithWeeklyNotes: boolean;
		weekStartsOn: string | undefined;
	} = $props();

	$effect(() => {
		console.log(allWeeklyNotes);
		console.log(weekStartsOn);
	});
</script>

<CalendarBase
	{birthDate}
	{lifespan}
	{weekStartsOn}
	componentName="CalendarBasic"
>
	{#snippet children(data)}
		{#if !data}
			<CalendarError />
		{:else}
			<div class="lwc__calendar--basic">
				<div class="lwc__birthDate-label">
					{data.validatedBirthDate.toLocaleDateString()}
				</div>
				<div class="lwc__calendar">
					{#each data.weeks as week}
						<WeekBlock
							title={week.startDate.toLocaleDateString()}
							mode={setWeekStatus(
								week.startDate,
								data.validatedWeekStartsOn,
							)}
							showDot={syncWithWeeklyNotes &&
								!!allWeeklyNotes?.[
									dateToDailyNoteFormatRecordKey(
										week.startDate,
									)
								]}
							onClick={() => {
								syncWithWeeklyNotes &&
									openWeeklyNoteFunction(
										week.startDate,
										modalFn,
									);
							}}
						/>
					{/each}
					{#if data.hasWeeks}
						<span class="lwc__deathDate-label"
							>{data.deathDate.toLocaleDateString()}</span
						>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}
</CalendarBase>
