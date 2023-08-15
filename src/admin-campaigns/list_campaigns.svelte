<script>
    import { onMount } from "svelte";
    import { apiGet } from "../libs/ajax.js";
    import {link} from 'svelte-spa-router'


    let campaigns = [];
    let state = "loading";

    onMount(async () => {
        const response = await apiGet("abengine/v1/campaigns");
        campaigns = response.campaigns.data;
        state = "loaded";
    });
</script>

<div class="campaigns">
    <div class="top_bar">
        <div class="breadcrumbs">ABEngine &gt; Campaigns</div>
        <a href="#/create"><button class="button button-primary">Create new campaign</button></a>
    </div>
    {#each campaigns as campaign}
    <div>Campaign {campaign}</div>
    {/each}
</div>