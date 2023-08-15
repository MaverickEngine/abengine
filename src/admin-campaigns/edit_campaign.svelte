<script>
    import { onMount } from "svelte";
    import { apiGet } from "../libs/ajax.js";

    import Campaign from "./campaign.svelte";
    
    export let _id = "";

    onMount(async () => {
        const response = await apiGet("abengine/v1/campaigns/" + _id);
        console.log(response);
    });

    function generate_uid() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    function do_save() {
        console.log("Save");
    }
</script>

<div class="breadcrumbs">ABEngine &gt; <a href="#/">Campaigns</a> &gt; Create Campaign</div>

<Campaign uid={uid} />
<button class="button button-primary" on:click={do_save} on:keypress={do_save}>Create</button>