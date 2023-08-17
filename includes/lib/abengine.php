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

    public function get_campaign($campaign_id) {
        return $this->get("api/campaign/{$campaign_id}");
    }

    public function update_campaign($campaign_id, $params) {
        return $this->put("api/campaign/{$campaign_id}", $params);
    }

    public function create_experiment($params) {
        $params["user_id"] = get_option("abengine_user_id");
        return $this->post("api/experiment", $params);
    }

    public function get_experiment($experiment_id) {
        return $this->get("api/experiment/{$experiment_id}");
    }

    public function update_experiment($experiment_id, $params) {
        return $this->put("api/experiment/{$experiment_id}", $params);
    }

    public function get_experiments($campaign_id) {
        return $this->get("api/experiment?filter[campaign_id]={$campaign_id}");
    }

    public function delete_experiment($experiment_id) {
        return $this->delete("api/experiment/{$experiment_id}");
    }
}