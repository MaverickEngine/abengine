<script>
    import SvelteWordpressForm from "../components/svelte-wordpress/svelte-wordpress-form.svelte";
    import SvelteWordpressFormInput from "../components/svelte-wordpress/svelte-wordpress-form-input.svelte";

    export let campaign = {};
</script>

{#if (campaign._id)}
<input type="hidden" name="_id" value="{campaign._id}">
{/if}
<SvelteWordpressForm>
    <SvelteWordpressFormInput label="Name" name="name" bind:value="{campaign.name}" id="name" />
    <SvelteWordpressFormInput label="Campaign Unique ID" name="uid" bind:value="{campaign.uid}" id="uid" />
    <SvelteWordpressFormInput label="Running" name="running" bind:checked="{campaign.running}" id="running" type="checkbox" />
    <SvelteWordpressFormInput label="Start Date" name="start_date" bind:value="{campaign.start_date}" id="start_date" type="date" />
    <SvelteWordpressFormInput label="End Date" name="end_date" bind:value="{campaign.end_date}" id="end_date" type="date" />
    <SvelteWordpressFormInput label="Data" name="data" bind:value="{campaign.data}" id="data" type="textarea" />
</SvelteWordpressForm>