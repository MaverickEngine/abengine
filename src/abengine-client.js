import APIClient from "./libs/abengine-api";

jQuery(function() {
    const abengineClient = new APIClient(abengine.restUrl, abengine.restNonce);
    abengineClient.init();
    console.log(abengine.restUrl, abengine.restNonce, jQuery);
});

export default {};