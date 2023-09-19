import APIClient from "./libs/abengine-api";
import "./css/abengine-client.less";

jQuery(function() {
    // console.log(abengine);
    const abengineClient = new APIClient(abengine.restUrl, abengine.restNonce, abengine.abengine_server);
    abengineClient.init();
    console.log(abengine.restUrl, abengine.restNonce, jQuery);
});

export default {};