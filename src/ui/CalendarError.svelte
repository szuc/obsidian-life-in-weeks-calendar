<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Unable to calculate calendar' }: Props = $props();
</script>

<span class="lwc__error-message">{message}</span>
