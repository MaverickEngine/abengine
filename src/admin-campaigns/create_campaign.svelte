<script>
    import { onMount } from "svelte";
    import { apiPost } from "wp-ajax";
    import { push, pop, replace } from 'svelte-spa-router'
    import { Alert } from "svelte-wordpress-components";
    import { generate_uid } from "../libs/uid.js";

    import Campaign from "./campaign.svelte";
    
    let campaign = {};
    let is_loading = false;
    let alert = null;

    onMount(async () => {
        if (campaign.uid === "") {
            campaign.uid = generate_uid();
        }
    });

    async function do_save() {
        try {
            is_loading = true;
            const result = await apiPost("abengine/v1/campaign", campaign);
            console.log(result);
            push("/edit/" + result.campaign.data._id);
        } catch (error) {
            alert = {
                type: "error",
                message: error.message || error.toString(),
            };
            console.error(error);
        } finally {
            is_loading = false;
        }
    }
</script>

<div class="breadcrumbs">ABEngine &gt; <a href="#/">Campaigns</a> &gt; Create Campaign</div>
{#if (alert)}
<Alert type={alert.type}>{alert.message}</Alert>
{/if}
<Campaign bind:campaign={campaign} />
<button class="button button-primary" on:click={do_save} on:keypress={do_save} disabled={is_loading}>Create</button>