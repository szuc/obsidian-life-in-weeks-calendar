<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Unable to calculate calendar' }: Props = $props();
</script>

<span class="error-message">{message}</span>

<style>
	.error-message {
		color: var(--lc-color-danger);
		font-style: italic;
		text-align: center;
		grid-column: 1 / -1;
		padding: 1rem;
		background-color: var(--lc-color-danger-bg);
		border: 1px solid var(--lc-color-danger-border);
		border-radius: var(--lc-week-border-radius);
		margin: 0.5rem 0;
	}
</style>
