<script lang="ts">
	import CalendarBase from './CalendarBase.svelte';
	import WeekBlock from './WeekBlock.svelte';
	import CalendarError from './CalendarError.svelte';
	import { App, TFile } from 'obsidian';
	import {
		openPeriodicNoteFunction,
		openWeeklyNoteFunction,
	} from 'src/lib/openWeeklyNote';
	import {
		dateToDailyNoteRecordKeyFormat,
		setWeekStatus,
	} from '../lib/utils';

	let {
		birthDate,
		lifespan,
		allWeeklyNotes,
		modalFn,
		usePeriodicNotes,
		weekStartsOn,
		folderPath,
		fileNamePattern,
		templatePath,
		app,
	}: {
		birthDate: Date;
		lifespan: number;
		allWeeklyNotes: Record<string, TFile> | undefined;
		modalFn: ((message: string, cb: () => void) => void) | undefined;
		usePeriodicNotes: boolean;
		weekStartsOn: string;
		folderPath: string;
		fileNamePattern: string;
		templatePath: string;
		app: App;
	} = $props();

	const showDotFn = (weekStartDate: Date) =>
		!!allWeeklyNotes?.[dateToDailyNoteRecordKeyFormat(weekStartDate)];

	const onClickFn = (weekStartDate: Date) => {
		if (usePeriodicNotes) {
			openPeriodicNoteFunction(
				app,
				weekStartDate,
				allWeeklyNotes,
				modalFn,
			);
		} else {
			openWeeklyNoteFunction(
				app,
				weekStartDate,
				allWeeklyNotes,
				folderPath,
				fileNamePattern,
				templatePath,
				modalFn,
			);
		}
	};
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
							showDot={showDotFn(week.startDate)}
							onClick={onClickFn
								? () => onClickFn(week.startDate)
								: undefined}
						/>
					{/each}
					{#if data.hasWeeks}
						<span class="lwc__deathDate-label">
							{data.deathDate.toLocaleDateString()}
						</span>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}
</CalendarBase>
