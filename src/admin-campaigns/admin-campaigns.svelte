<script>
    import Router from 'svelte-spa-router';
    import { onMount } from "svelte";
    import CreateCampaign from "./create_campaign.svelte";
    import EditCampaign from './edit_campaign.svelte';
    import ListCampaigns from "./list_campaigns.svelte";

    // console.log($abengine);
    let state = "loading";

    onMount(async () => {
        state = "loaded";
    });

    const routes = {
        "/": ListCampaigns,
        "/create": CreateCampaign,
        "/edit/:_id": EditCampaign,
    }
</script>

<main>
    <Router {routes} />
</main>