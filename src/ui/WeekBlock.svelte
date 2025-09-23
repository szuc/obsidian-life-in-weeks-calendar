<script lang="ts">
	interface Props {
		title?: string;
		mode?: 'past' | 'present' | 'future';
		showDot?: boolean;

		onClick: () => void;
		gridOffset: number;
	}
	const {
		title,
		mode = 'future',
		showDot,
		gridOffset,
		onClick,
	}: Props = $props();
	const weekClass = $derived(`lwc__week lwc__week--${mode}`);
</script>

<button data-offset={gridOffset} {title} class={weekClass} onclick={onClick}>
	{#if !!showDot}
		<span class="lwc__week__dot"></span>
	{/if}
</button>
