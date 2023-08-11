<?php

require_once(plugin_dir_path( dirname( __FILE__ ) ).'lib/abengine.php');

class ABEngineAPI {
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_api_routes' ) );
    }
    
    public function register_api_routes() {
        register_rest_route( 'abengine/v1', '/campaign', array(
            'methods' => 'POST',
            'callback' => array( $this, 'create_campaign' ),
        ) );
        register_rest_route( 'abengine/v1', '/campaigns', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_campaigns' ),
        ) );
        register_rest_route( 'abengine/v1', '/campaign/(?P<campaign_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_campaign' ),
        ) );
        register_rest_route( 'abengine/v1', '/experiment/(?P<campaign_id>\d+)', array(
            'methods' => 'POST',
            'callback' => array( $this, 'create_experiment' ),
        ) );
        register_rest_route( 'abengine/v1', '/experiments/(?P<campaign_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_experiments' ),
        ) );
        register_rest_route( 'abengine/v1', '/experiment/(?P<experiment_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_experiment' ),
        ) );
        register_rest_route( 'abengine/v1', '/experiment/(?P<experiment_id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array( $this, 'update_experiment' ),
        ) );
        register_rest_route( 'abengine/v1', '/hit/(?P<experiment_id>\d+)', array(
            'methods' => 'POST',
            'callback' => array( $this, 'register_hit' ),
        ) );
        register_rest_route( 'abengine/v1', '/win/(?P<experiment_id>\d+)', array(
            'methods' => 'POST',
            'callback' => array( $this, 'register_win' ),
        ) );
    }

    public function create_campaign(WP_REST_Request $request) {
        try {
            $abengine = new ABEngine();
            $data = $request->get_json_params();
            // Check that we have a uid
            if (!isset($data['uid'])) {
                throw new Exception("Missing uid");
            }
            $campaign = $abengine->create_campaign($data);
            return rest_ensure_response(['status' => 'success', "campaign" => $campaign]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function get_campaign(WP_REST_Request $request) {
        try {
            $test = new ABTest($request['test_id']);
            return rest_ensure_response(['status' => 'success', "test" => $test->get_data()]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function get_campaigns(WP_REST_Request $request) {
        try {
            $abengine = new ABEngine();
            $campaigns = $abengine->get_campaigns();
            return rest_ensure_response(['status' => 'success', "campaigns" => $campaigns]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }
}