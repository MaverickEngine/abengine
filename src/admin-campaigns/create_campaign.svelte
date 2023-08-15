<script>
    import { onMount } from "svelte";
    import { apiPost } from "../libs/ajax.js";

    import Campaign from "./campaign.svelte";
    
    let name = "";
    let uid = "";
    let running = false;
    let start_date = "";
    let end_date = "";
    let data = "";

    onMount(async () => {
        if (uid === "") {
            uid = generate_uid();
        }
    });

    function generate_uid() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async function do_save() {
        const result = await apiPost("abengine/v1/campaign", {
            name,
            uid,
            running,
            start_date,
            end_date,
            data
        });
        console.log(result);
    }
</script>

<div class="breadcrumbs">ABEngine &gt; <a href="#/">Campaigns</a> &gt; Create Campaign</div>

<Campaign bind:uid={uid} bind:running={running} bind:start_date={start_date} bind:end_date={end_date} bind:data={data} bind:name={name} />
<button class="button button-primary" on:click={do_save} on:keypress={do_save}>Create</button>