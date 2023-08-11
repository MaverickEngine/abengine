<script>
    import { abengine, tests } from "./stores.js";
    import { onMount } from "svelte";
    import { apiGet } from "../libs/ajax.js";
    // import ABEngineAPI from "../libs/abengine-api.ts";

    // console.log($abengine);
    let state = "loading";
    // let abengine_api = new ABEngineAPI($abengine.restUrl, $abengine.restNonce);

    onMount(async () => {
        console.log("Mounted");
        apiGet("abengine/v1/campaigns", (data) => {
            console.log(data);
        });
        state = "loaded";
    });
</script>

<main>
    
</main>