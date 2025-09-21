<script lang="ts">
	interface Props {
		title?: string;
		mode?: 'past' | 'present' | 'future';
		showDot?: boolean;
		style?: string;
		onClick: () => void;
	}
	const { title, mode = 'future', showDot, style, onClick }: Props = $props();
	const weekClass = $derived(`lwc__week lwc__week--${mode}`);
</script>

<button {style} {title} class={weekClass} onclick={onClick}>
	{#if !!showDot}
		<span class="lwc__week__dot"></span>
	{/if}
</button>
