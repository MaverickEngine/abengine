<script>
    import Router from 'svelte-spa-router';
    import { abengine, tests } from "./stores.js";
    import { onMount } from "svelte";
    import CreateCampaign from "./create_campaign.svelte";
    import EditCampaign from './edit_campaign.svelte';
    import ListCampaigns from "./list_campaigns.svelte";

    // console.log($abengine);
    let state = "loading";

    const basepath = "/wp-admin/admin.php?page=abengine_campaigns";
    // let abengine_api = new ABEngineAPI($abengine.restUrl, $abengine.restNonce);

    onMount(async () => {
        state = "loaded";
    });

    function createCampaign() {
        console.log("Create campaign");
    }

    const routes = {
        "/": ListCampaigns,
        "/create": CreateCampaign,
        "/edit/:_id": EditCampaign,
    }
</script>

<main>
    <Router {routes} />
</main>