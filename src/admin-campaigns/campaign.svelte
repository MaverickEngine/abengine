<script>
    import SvelteWordpressForm from "../components/svelte-wordpress/svelte-wordpress-form.svelte";
    import SvelteWordpressFormInput from "../components/svelte-wordpress/svelte-wordpress-form-input.svelte";

    export let _id = "";
    export let name = "";
    export let uid = "";
    export let running = false;
    export let start_date = "";
    export let end_date = "";
    export let data = "";
</script>

{#if (_id)}
<input type="hidden" name="_id" value="{_id}">
{/if}
<SvelteWordpressForm>
    <SvelteWordpressFormInput label="Name" name="name" bind:value="{name}" id="name" />
    <SvelteWordpressFormInput label="Campaign Unique ID" name="uid" bind:value="{uid}" id="uid" />
    <SvelteWordpressFormInput label="Running" name="running" bind:checked="{running}" id="running" type="checkbox" />
    <SvelteWordpressFormInput label="Start Date" name="start_date" bind:value="{start_date}" id="start_date" type="date" />
    <SvelteWordpressFormInput label="End Date" name="end_date" bind:value="{end_date}" id="end_date" type="date" />
    <SvelteWordpressFormInput label="Data" name="data" bind:value="{data}" id="data" type="textarea" />
</SvelteWordpressForm>