<?php

require_once("edji-sdk.php");

class ABEngine extends EdjiSDK {
    public function __construct() {
        parent::__construct(get_option('abengine_apikey'), get_option('abengine_api_server'));
    }

    public function get_campaigns() {
        return $this->get("api/campaign");
    }

    public function create_campaign($params) {
        $params["user_id"] = get_option("abengine_user_id");
        return $this->post("api/campaign", $params);
    }
}