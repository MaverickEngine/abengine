<script>
    import { Form, FormInput } from "svelte-wordpress-components";

    export let experiment = {};
</script>

{#if (experiment._id)}
<input type="hidden" name="_id" value="{experiment._id}">
{/if}
<Form>
    <FormInput label="Name" name="name" bind:value="{experiment.name}" id="name" />
    <FormInput label="Experiment Unique ID" name="uid" bind:value="{experiment.uid}" id="uid" />
    <FormInput label="Running" name="running" bind:checked="{experiment.running}" id="running" type="checkbox" />
    <FormInput label="Start Date" name="start_date" bind:value="{experiment.start_date}" id="start_date" type="date" />
    <FormInput label="End Date" name="end_date" bind:value="{experiment.end_date}" id="end_date" type="date" />
    <FormInput label="Value" name="value" bind:value="{experiment.value}" id="value" type="textarea" />
    <FormInput label="Data" name="data" bind:value="{experiment.data}" id="data" type="textarea" />
</Form>