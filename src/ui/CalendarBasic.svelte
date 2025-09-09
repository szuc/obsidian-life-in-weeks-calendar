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
	}: {
		birthDate: Date;
		lifespan: number;
		allWeeklyNotes: Record<string, TFile> | undefined;
		modalFn: ((message: string, cb: () => void) => void) | undefined;
		syncWithWeeklyNotes: boolean;
	} = $props();
</script>

<CalendarBase {birthDate} {lifespan} componentName="CalendarBasic">
	{#snippet children(data)}
		<div class="life-in-weeks-calendar-basic">
			<div class="birthDate-label">
				{data.validatedBirthDate.toLocaleDateString()}
			</div>
			<div class="calendar">
				{#each data.weeks as week}
					<WeekBlock
						title={week.startDate.toLocaleDateString()}
						mode={setWeekStatus(week.startDate)}
						showDot={syncWithWeeklyNotes &&
							!!allWeeklyNotes?.[
								dateToDailyNoteFormatRecordKey(week.startDate)
							]}
						onClick={() => {
							syncWithWeeklyNotes &&
								openWeeklyNoteFunction(week.startDate, modalFn);
						}}
					/>
				{/each}
				{#if data.hasWeeks}
					<span class="deathDate-label"
						>{data.deathDate.toLocaleDateString()}</span
					>
				{:else}
					<CalendarError />
				{/if}
			</div>
		</div>
	{/snippet}
</CalendarBase>

<style>
	.life-in-weeks-calendar-basic {
		margin: 0 auto var(--lc-calendar-margin-bottom);
		max-width: var(--lc-calendar-max-width);
		padding-bottom: var(--lc-calendar-padding-bottom);
	}
	.birthDate-label {
		margin: 0 auto;
	}
	.deathDate-label {
		font-size: var(--lc-week-size);
		line-height: 1;
	}
	.calendar {
		display: grid;
		grid-template-columns: repeat(
			auto-fit,
			minmax(var(--lc-week-size), 1fr)
		);
		max-width: var(--lc-calendar-max-width);
		gap: var(--lc-calendar-grid-gap-row) var(--lc-calendar-grid-gap-column);
		margin: 0 auto var(--lc-calendar-margin-bottom);
		align-items: center;
	}
</style>
