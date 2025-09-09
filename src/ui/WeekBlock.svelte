<script lang="ts">
	interface Props {
		title?: string;
		mode?: 'past' | 'present' | 'future';
		showDot?: boolean;
		style?: string;
		onClick: () => void;
	}
	const { title, mode = 'future', showDot, style, onClick }: Props = $props();
	const weekClass = $derived(`week week--${mode}`);
</script>

<button {style} {title} class={weekClass} onclick={onClick}>
	{#if !!showDot}
		<span class="dot"></span>
	{/if}
</button>

<style>
	.week {
		padding: unset;
		box-shadow: unset;
		font-weight: unset;
		cursor: unset;
		font-family: inherit;
		outline: none;
		user-select: none;
		white-space: nowrap;
		width: var(--lc-week-size);
		height: var(--lc-week-size);
		display: inline-flex;
		background-color: var(--lc-color-week-default-bg);
		border: var(--lc-week-border-width) solid
			var(--lc-color-week-default-border);
		overflow: hidden;
		justify-content: center;
		align-items: center;
		border-radius: var(--lc-week-border-radius);
	}
	.week--present {
		background-color: var(--lc-color-week-current-bg);
		color: var(--lc-color-week-current-text);
	}
	.week--past {
		background-color: var(--lc-color-week-past-bg);
		color: var(--lc-color-week-past-text);
		border-color: var(--lc-color-week-past-border);
	}
	.dot {
		background-color: currentColor;
		height: var(--lc-week-dot-size);
		width: var(--lc-week-dot-size);
		border-radius: 50%;
	}
</style>
