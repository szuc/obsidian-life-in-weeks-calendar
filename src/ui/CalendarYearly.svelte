<script lang="ts">
	import {
		eachWeekOfInterval,
		addYears,
		addWeeks,
		subWeeks,
		getWeek,
	} from 'date-fns';
	import CalendarBase from './CalendarBase.svelte';
	import WeekBlock from './WeekBlock.svelte';
	import CalendarError from './CalendarError.svelte';
	import { openWeeklyNoteFunction } from '../lib/openWeeklyNote';
	import { TFile } from 'obsidian';
	import {
		dateToDailyNoteFormatRecordKey,
		setWeekStatus,
	} from '../lib/utils';
	import type { Week } from 'src/lib/types';
	import { CALENDAR_LAYOUT } from 'src/lib/calendar-constants';

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

	/**
	 * Groups weeks into year-based chunks for the yearly calendar display
	 * Uses shared calendar data and adds year grouping functionality
	 */
	function createYearGroups(
		validatedBirthDate: Date,
		validatedLifespan: number,
		birthWeek: Date,
	): Week[][] {
		const yearsPerGroup = CALENDAR_LAYOUT.YEAR_GROUP_SIZE;

		try {
			const yearGroups: Week[][] = [];
			const endDate = addYears(birthWeek, validatedLifespan);
			let currentStartDate = validatedBirthDate;

			// Validate inputs
			if (
				!validatedBirthDate ||
				validatedLifespan <= 0 ||
				yearsPerGroup <= 0
			) {
				console.warn(
					'CalendarYearly: Invalid parameters for year grouping',
				);
				return [];
			}

			while (currentStartDate < endDate) {
				const currentEndDate = subWeeks(
					addYears(
						currentStartDate,
						Math.min(
							validatedLifespan -
								yearGroups.length * yearsPerGroup,
							yearsPerGroup,
						),
					),
					1,
				);

				try {
					const weekIntervals = eachWeekOfInterval({
						start: currentStartDate,
						end: currentEndDate,
					});
					yearGroups.push(
						weekIntervals.map((weekStartDate, index) => ({
							index,
							startDate: weekStartDate,
						})),
					);
				} catch (intervalError) {
					console.error(
						'CalendarYearly: Error calculating week interval for year group:',
						intervalError,
					);
					// Skip this group but continue with others
				}

				currentStartDate = addWeeks(currentEndDate, 1);
			}

			return yearGroups;
		} catch (error) {
			console.error('CalendarYearly: Error in createYearGroups:', error);
			return []; // Return empty array as fallback
		}
	}
</script>

<CalendarBase {birthDate} {lifespan} componentName="CalendarYearly">
	{#snippet children(data)}
		{#if !data}
			<CalendarError />
		{:else}
			{@const yearGroups = createYearGroups(
				data.validatedBirthDate,
				data.validatedLifespan,
				data.birthWeek,
			)}
			<div class="lwc__calendar-yearly">
				{#each yearGroups as section, index}
					<div class="lwc__group">
						<div class="lwc__year-label">
							{String(
								index * CALENDAR_LAYOUT.YEAR_GROUP_SIZE,
							).padStart(2, '0')}
						</div>
						<div class="lwc__calendar__grid">
							{#each section as week}
								<WeekBlock
									title={week.startDate.toLocaleDateString()}
									mode={setWeekStatus(week.startDate)}
									showDot={syncWithWeeklyNotes &&
										!!allWeeklyNotes?.[
											dateToDailyNoteFormatRecordKey(
												week.startDate,
											)
										]}
									style={`grid-column: ${getWeek(week.startDate)}`}
									onClick={() => {
										syncWithWeeklyNotes &&
											openWeeklyNoteFunction(
												week.startDate,
												modalFn,
											);
									}}
								/>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/snippet}
</CalendarBase>
