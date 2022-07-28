jQuery("#abengine_load_powerwords").on("click", async function() {
    const powerword_list = await (await fetch(abengine_powerwords_url)).text();
    jQuery("#abengine_powerwords_list").val(powerword_list);
});