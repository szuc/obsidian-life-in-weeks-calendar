<script lang="ts">
	import { getWeek } from 'date-fns';
	import CalendarBase from './CalendarBase.svelte';
	import WeekBlock from './WeekBlock.svelte';
	import CalendarError from './CalendarError.svelte';
	import { openWeeklyNoteFunction } from '../lib/openWeeklyNote';
	import { App, TFile } from 'obsidian';
	import {
		dateToDailyNoteFormatRecordKey,
		setWeekStatus,
	} from '../lib/utils';
	import { CALENDAR_LAYOUT } from 'src/lib/calendar-constants';
	import { createYearGroups } from 'src/lib/generateCalendarData';

	let {
		birthDate,
		lifespan,
		allWeeklyNotes,
		modalFn,
		syncWithWeeklyNotes,
		weekStartsOn,
		app,
	}: {
		birthDate: Date;
		lifespan: number;
		allWeeklyNotes: Record<string, TFile> | undefined;
		modalFn: ((message: string, cb: () => void) => void) | undefined;
		syncWithWeeklyNotes: boolean;
		weekStartsOn: string | undefined;
		app: App;
	} = $props();

	const makeGroupLabel = (index: number) =>
		String(index * CALENDAR_LAYOUT.YEAR_GROUP_SIZE).padStart(2, '0');

	const showDotFn = (weekStartDate: Date) =>
		syncWithWeeklyNotes &&
		!!allWeeklyNotes?.[dateToDailyNoteFormatRecordKey(weekStartDate)];

	const onClickFn = syncWithWeeklyNotes
		? (weekStartDate: Date) => {
				openWeeklyNoteFunction(
					app,
					weekStartDate,
					allWeeklyNotes,
					modalFn,
				);
			}
		: undefined;
</script>

<CalendarBase
	{birthDate}
	{lifespan}
	{weekStartsOn}
	componentName="CalendarYearly"
>
	{#snippet children(data)}
		{#if !data}
			<CalendarError />
		{:else}
			{@const yearGroups = createYearGroups(
				data.validatedBirthDate,
				data.validatedLifespan,
				data.birthWeek,
				data.validatedWeekStartsOn,
			)}
			<div class="lwc__calendar-yearly">
				{#each yearGroups as section, index}
					<div class="lwc__group">
						<div class="lwc__year-label">
							{makeGroupLabel(index)}
						</div>
						<div class="lwc__calendar__grid">
							{#each section as week}
								<WeekBlock
									title={week.startDate.toLocaleDateString()}
									mode={setWeekStatus(
										week.startDate,
										data.validatedWeekStartsOn,
									)}
									showDot={showDotFn(week.startDate)}
									gridOffset={getWeek(week.startDate)}
									onClick={!!onClickFn
										? () => onClickFn(week.startDate)
										: undefined}
								/>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/snippet}
</CalendarBase>
