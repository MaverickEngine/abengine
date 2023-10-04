<script>
    import {Form, FormInput} from "svelte-wordpress-components"

    export let campaign = {};
</script>

{#if (campaign._id)}
<input type="hidden" name="_id" value="{campaign._id}">
{/if}
<Form>
    <FormInput label="Name" name="name" bind:value="{campaign.name}" id="name" />
    <FormInput label="Campaign Unique ID" name="uid" bind:value="{campaign.uid}" id="uid" />
    <FormInput label="Running" name="running" bind:checked="{campaign.running}" id="running" type="checkbox" />
    <FormInput label="Start Date" name="start_date" bind:value="{campaign.start_date}" id="start_date" type="date" />
    <FormInput label="End Date" name="end_date" bind:value="{campaign.end_date}" id="end_date" type="date" />
    <FormInput label="Data" name="data" bind:value="{campaign.data}" id="data" type="textarea" />
</Form>