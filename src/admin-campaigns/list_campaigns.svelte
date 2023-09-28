<script>
    import { onMount } from "svelte";
    import { apiGet } from "wp-ajax";
    import {link} from 'svelte-spa-router'

    import { ListTable } from "svelte-wordpress-components";

    const headers = [
        {
            name: "select",
            key: "select",
            type: "select",
        },
        {
            name: "Name",
            key: "link_name",
            type: "unsafe",
        },
        {
            name: "Created",
            key: "createdAt",
            type: "date",
        },
        {
            name: "Start Date",
            key: "start_date",
            type: "date",
        },
        {
            name: "End Date",
            key: "end_date",
            type: "date",
        },
        {
            name: "Running",
            key: "running",
            type: "boolean",
        },
    ]

    let campaigns = [];
    let state = "loading";

    onMount(async () => {
        const response = await apiGet("abengine/v1/campaigns");
        campaigns = response.campaigns.data;
        for(let campaign of campaigns) {
            campaign.link_name = `<a href="#/edit/${campaign._id}">${campaign.name}</a>`;
        }
        state = "loaded";
    });
</script>

<div class="campaigns">
    <div class="top_bar">
        <div class="breadcrumbs">ABEngine &gt; Campaigns</div>
        <a href="#/create"><button class="button button-primary">Create new campaign</button></a>
    </div>
    <ListTable {headers} bind:data={campaigns} />
</div>