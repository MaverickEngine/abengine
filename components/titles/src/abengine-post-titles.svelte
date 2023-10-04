<script>
    import { onMount } from "svelte";
    import { apiGet, apiPut, apiPost, apiDelete } from "wp-ajax";

    import { Button, Alert } from "svelte-wordpress-components";
    let post_id;
    let state = "loading";
    let message = null;
    let campaign = null;
    let experiments = null;
    let title = null;
    let titleElement = null;

    onMount(async () => {
        post_id = document.querySelector("#post_ID").value;
        titleElement = document.querySelector("#title");
        title = titleElement.value;
        await load_campaign();
        if (state === "new") return;
        await init();
    });

    async function init() {
        await load_experiments();
        if (experiments.length === 0) {
            await save_current_title();
        }
        if (experiments[0].value != title) {
            await save_current_title();
        }
        const form = document.querySelector("form#post");
        form.addEventListener("submit", async (e) => {
            try {
                e.preventDefault();
                await save_all_titles();
                form.submit();
            } catch(err) {
                message = {
                    status: "error",
                    message: `Error saving ABEngine Campaign: ${err.message}`
                }
            }
        });
        titleElement.addEventListener("change", async (e) => {
            experiments[0].value = e.target.value;
        });
        titleElement.addEventListener("keyup", async (e) => {
            experiments[0].value = e.target.value;
        });
        console.log({campaign, experiments});
        state = "loaded";
    }

    async function onNewCampaignClick(e) {
        try {
            e.preventDefault();
            const title = document.querySelector("#title").value;
            const response = await apiPost(`abengine/titles/v1/post/${post_id}`, {
                title
            });
            campaign = response.campaign.data;
            console.log(response);
            await init();
        } catch(err) {
            message = {
                status: "error",
                message: `Error creating new ABEngine Campaign: ${err.message}`
            }
        }
    }

    async function load_campaign() {
        try {
            const response = await apiGet(`abengine/titles/v1/post/${post_id}`);
            campaign = response.campaign.data;
            console.log({campaign});
        } catch(err) {
            if (err.status === 404) {
                state = "new";
            } else {
                message = {
                    status: "error",
                    message: `Error loading ABEngine Campaign: ${err.message}`
                }
            }
        }
    }

    async function load_experiments() {
        try {
            const response = await apiGet(`abengine/v1/experiments/${campaign._id}`);
            experiments = response.experiments.data;
        } catch(err) {
            message = {
                status: "error",
                message: `Error loading ABEngine Experiments: ${err.message}`
            }
        }
    }

    async function save_current_title() {
        try {
            const title = document.querySelector("#title").value;
            const experiment = {
                value: title,
                uid: `abengine-title-${post_id}-primary`,
                campaign_id: campaign._id,
            }
            await apiPost(`abengine/v1/experiment`, experiment);
            await load_experiments();
        } catch(err) {
            message = {
                status: "error",
                message: `Error saving ABEngine Title: ${err.message}`
            }
        }
    }

    async function save_all_titles() {
        await apiPut(`abengine/v1/experiments`, {experiments: experiments.filter(experiment => (experiment.value && experiment.value.length > 0 && experiment.uid))});
    }

    function uniqueUid() {
        let num = experiments.length;
        while(experiments.find(experiment => experiment.uid === `abengine-title-${post_id}-${num}`)) {
            num++;
        }
        return `abengine-title-${post_id}-${num}`;
    }

    function onNewExperimentClick(e) {
        e.preventDefault();
        experiments.push({
            value: "",
            uid: uniqueUid(),
            campaign_id: campaign._id,
            hits: 0,
            wins: 0
        });
        experiments = [...experiments];
    }

    function onDeleteExperimentClick(e, i) {
        e.preventDefault();
        const experiment = experiments.splice(i, 1);
        experiments = [...experiments];
        apiDelete(`abengine/v1/experiment/${experiment[0]._id}`);
    }
</script>

{#if message}
    <Alert type={message.status} dismissible={true}>{message.message}</Alert>
{/if}

{#if state === "loading"}
    <h3>ABEngine loading...</h3>
{:else if state === "new"}
    <Button primary=true on:click={onNewCampaignClick}>New AB Title Test</Button>
{:else if state === "loaded"}
    {#each experiments as experiment, i}
    <div class="abengine-title-container">
        <input class="abengine-title-input" type="text" name="abengine_title_{i}" size="30" bind:value={experiment.value} id={experiment.uid} spellcheck="true" autocomplete="off" readonly={i === 0}>
        <span class="abengine-title-stats">{experiment.wins}/{experiment.hits}</span>
        {#if i > 0}
            <Button warning=true on:click={e => onDeleteExperimentClick(e, i)}>Delete</Button>
        {/if}
    </div>
    {/each}
    <Button class="abengine-title-new-experiment-button" primary=true on:click={onNewExperimentClick}>New AB Title Experiment</Button>
{/if}

<style>
    .abengine-title-container {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .abengine-title-stats {
        margin-right: 10px;
    }

    input.abengine-title-input {
        margin-right: 10px;
        margin-bottom: 5px;
        flex-grow: 2;
    }

    .abengine-title-new-experiment-button {
        margin-top: 10px;
    }
</style>