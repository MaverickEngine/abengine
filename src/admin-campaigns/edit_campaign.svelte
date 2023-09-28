<script>
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { apiGet, apiPut, apiPost, apiDelete } from "wp-ajax";
    import { Alert } from "svelte-wordpress-components";
    import { generate_uid } from "../libs/uid.js";

    import Campaign from "./campaign.svelte";
    import Experiment from "./experiment.svelte";
    
    let is_loading = false;
    let alert = null;
    let current_tab = "campaign";

    export let params;
    export let campaign = {};

    let experiments = [];
    let current_experiment_index = 0;
    // let experiment;

    async function load_data() {
        try {
            is_loading = true;
            const response = await apiGet("abengine/v1/campaign/" + params._id);
            campaign = response.campaign.data;
            const response2 = await apiGet("abengine/v1/experiments/" + params._id);
            experiments = response2.experiments.data;
        } catch (error) {
            console.error(error);
        } finally {
            is_loading = false;
        }
    }

    onMount(async () => {
        await load_data();
    });

    async function do_save() {
        try {
            is_loading = true;
            await apiPut("abengine/v1/campaign/" + params._id, campaign);
            for (let experiment of experiments) {
                if (experiment._id) {
                    await apiPut("abengine/v1/experiment/" + experiment._id, experiment);
                } else {
                    await apiPost("abengine/v1/experiment", experiment);
                }
            }
            await load_data();
            alert = {
                type: "success",
                message: "Campaign saved successfully",
            };
            setTimeout(() => {
                alert = null;
            }, 3000);
        } catch (error) {
            console.error(error);
            alert = {
                type: "error",
                message: error.message || error.toString(),
            };
        } finally {
            is_loading = false;
        }
    }

    function do_select_tab(id) {
        current_tab = id;
        if (id === "campaign") {
            current_experiment_index = 0;
        } else {
            current_experiment_index = get_current_experiment_index();
        }
        // experiment = experiments[get_current_experiment_index()];
    }

    function do_add_experiment() {
        experiments.push({
            name: "Experiment " + (experiments.length + 1),
            uid: generate_uid(),
            campaign_id: campaign._id,
        });
        experiments = [...experiments];
        do_select_tab(`experiment_${experiments.length - 1}`);
    }

    function get_current_experiment_index() {
        const i = current_tab.split("_")[1];
        return i;
    }

    async function delete_experiment($id) {
        try {
            is_loading = true;
            await apiDelete("abengine/v1/experiment/" + $id);
            await load_data();
            alert = {
                type: "success",
                message: "Experiment deleted successfully",
            };
            setTimeout(() => {
                alert = null;
            }, 3000);
        } catch (error) {
            console.error(error);
            alert = {
                type: "error",
                message: error.message || error.toString(),
            };
        } finally {
            is_loading = false;
        }
    }

    async function do_delete() {
        if (confirm("Are you sure you want to delete this experiment?")) {
            if (experiments[current_experiment_index]._id) {
                await delete_experiment(experiments[current_experiment_index]._id);
            } else {
                experiments.splice(get_current_experiment_index(), 1);
            }
            experiments = [...experiments];
            do_select_tab("campaign");
        }
    }
</script>

<div class="flex flex-row">
    <div class="breadcrumbs">ABEngine &gt; <a href="#/">Campaigns</a> &gt; Edit Campaign</div>
    <div><button class="button button-primary" on:click={do_save} on:keypress={do_save} disabled={is_loading}>Save</button></div>
</div>
{#if (alert)}
<div transition:slide>
<Alert type={alert.type} dismissible={true}>{alert.message}</Alert>
</div>
{/if}
<nav class="nav-tab-wrapper">
    <a on:click|preventDefault={() => do_select_tab("campaign")} href={""} class="nav-tab" class:nav-tab-active={current_tab === "campaign"} >Campaign {campaign.name}</a>
    {#each experiments as experiment, i}
    <a on:click|preventDefault={() => do_select_tab(`experiment_${i}`)} href={""} class="nav-tab" class:nav-tab-active={current_tab === `experiment_${i}`} >{experiment.name || i + 1}</a>
    {/each}
    <a on:click|preventDefault={do_add_experiment} href={""} class="nav-tab" >
        <span class="dashicons dashicons-plus"></span>
    </a>
</nav>

{#if current_tab === "campaign"}
<div class="campaign">
   
    <Campaign bind:campaign={campaign} />
    
</div>
{:else}
<div class="experiment">
    <Experiment bind:experiment={experiments[current_experiment_index]} />
    <button class="button button-warning" on:click={do_delete} on:keypress={do_delete} disabled={is_loading}>Delete</button>
</div>
{/if}

<style>
    .flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .flex-row {
        flex-direction: row;
    }
</style>