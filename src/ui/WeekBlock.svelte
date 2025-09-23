<script lang="ts">
	interface Props {
		title?: string;
		mode?: 'past' | 'present' | 'future';
		gridOffset?: number;
		showDot?: boolean;
		onClick: (() => void) | undefined;
	}
	const {
		title,
		mode = 'future',
		gridOffset,
		showDot,
		onClick,
	}: Props = $props();
	const weekClass = $derived(`lwc__week lwc__week--${mode}`);
</script>

{#if onClick !== undefined}
	<!-- Return a button for weekly note integration -->
	<button
		data-offset={gridOffset}
		{title}
		class={weekClass}
		onclick={onClick}
	>
		{#if !!showDot}
			<span class="lwc__week__dot"></span>
		{/if}
	</button>
{:else}
	<!-- Return a div if not handling file interactions -->
	<div data-offset={gridOffset} {title} class={weekClass}></div>
{/if}
