<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = "Unable to calculate calendar" }: Props = $props();
</script>

<span class="error-message">{message}</span>

<style>
	.error-message {
		color: #d32f2f;
		font-style: italic;
		text-align: center;
		grid-column: 1 / -1;
		padding: 1rem;
		background-color: #ffeaea;
		border: 1px solid #ffcdd2;
		border-radius: 4px;
		margin: 0.5rem 0;
	}
</style>
