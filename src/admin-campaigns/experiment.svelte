<script>
    import SvelteWordpressForm from "../components/svelte-wordpress/svelte-wordpress-form.svelte";
    import SvelteWordpressFormInput from "../components/svelte-wordpress/svelte-wordpress-form-input.svelte";

    export let experiment = {};
</script>

{#if (experiment._id)}
<input type="hidden" name="_id" value="{experiment._id}">
{/if}
<SvelteWordpressForm>
    <SvelteWordpressFormInput label="Name" name="name" bind:value="{experiment.name}" id="name" />
    <SvelteWordpressFormInput label="Experiment Unique ID" name="uid" bind:value="{experiment.uid}" id="uid" />
    <SvelteWordpressFormInput label="Running" name="running" bind:checked="{experiment.running}" id="running" type="checkbox" />
    <SvelteWordpressFormInput label="Start Date" name="start_date" bind:value="{experiment.start_date}" id="start_date" type="date" />
    <SvelteWordpressFormInput label="End Date" name="end_date" bind:value="{experiment.end_date}" id="end_date" type="date" />
    <SvelteWordpressFormInput label="Value" name="value" bind:value="{experiment.value}" id="value" type="textarea" />
    <SvelteWordpressFormInput label="Data" name="data" bind:value="{experiment.data}" id="data" type="textarea" />
</SvelteWordpressForm>