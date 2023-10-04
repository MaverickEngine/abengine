<?php

require_once(plugin_dir_path( dirname( __FILE__ ) ).'lib/abengine.php');

class ABEngineAPI {
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_api_routes' ) );
    }
    
    public function register_api_routes() {
        register_rest_route( 'abengine/v1', '/login', array(
            'methods' => 'POST',
            'callback' => array( $this, 'login' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/logout', array(
            'methods' => 'GET',
            'callback' => array( $this, 'logout' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/campaign', array(
            'methods' => 'POST',
            'callback' => array( $this, 'create_campaign' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/campaigns', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_campaigns' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/campaign/(?P<campaign_id>[a-f\d]{24})', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_campaign' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/campaign/uid/(?P<uid>.*)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_campaign_by_uid' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/campaign/(?P<campaign_id>[a-f\d]{24})', array(
            'methods' => 'PUT',
            'callback' => array( $this, 'update_campaign' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/experiments/(?P<campaign_id>[a-f\d]{24})', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_experiments' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/experiment', array(
            'methods' => 'POST',
            'callback' => array( $this, 'create_experiment' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/experiment/(?P<experiment_id>[a-f\d]{24})', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_experiment' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/experiment/(?P<experiment_id>[a-f\d]{24})', array(
            'methods' => 'PUT',
            'callback' => array( $this, 'update_experiment' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/experiments', array(
            'methods' => 'PUT',
            'callback' => array( $this, 'update_experiments' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/experiment/(?P<experiment_id>[a-f\d]{24})', array(
            'methods' => 'DELETE',
            'callback' => array( $this, 'delete_experiment' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/hit/(?P<experiment_id>[a-f\d]{24})', array(
            'methods' => 'POST',
            'callback' => array( $this, 'register_hit' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
        register_rest_route( 'abengine/v1', '/win/(?P<experiment_id>[a-f\d]{24})', array(
            'methods' => 'POST',
            'callback' => array( $this, 'register_win' ),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ) );
    }

    public function login(WP_REST_Request $request) {
        try {
            $abengine = new ABEngine();
            $data = $request->get_params();
            // Check that we have a uid
            if (!isset($data['email'])) {
                throw new Exception("Missing email" );
            }
            if (!isset($data['password'])) {
                throw new Exception("Missing password" );
            }
            $user = $abengine->login($data['email'], $data['password']);
            // Save user's token
            update_user_meta( get_current_user_id(), 'abengine_apikey', $user->apikey );
            return rest_ensure_response(['status' => 'success', "user" => $user]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function logout(WP_REST_Request $request) {
        try {
            $abengine = new ABEngine();
            $abengine->logout();
            delete_user_meta( get_current_user_id(), 'abengine_apikey' );
            return rest_ensure_response(['status' => 'success']);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function create_campaign(WP_REST_Request $request) {
        try {
            $abengine = new ABEngine();
            $data = $request->get_params();
            // Check that we have a uid
            if (!isset($data['uid'])) {
                throw new Exception("Missing uid!" . json_encode($data));
            }
            $campaign = $abengine->create_campaign($data);
            return rest_ensure_response(['status' => 'success', "campaign" => $campaign]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function get_campaign(WP_REST_Request $request) {
        try {
            $id = $request['campaign_id'];
            $abengine = new ABEngine();
            $campaign = $abengine->get_campaign($id);
            return rest_ensure_response(['status' => 'success', "campaign" => $campaign]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function get_campaign_by_uid(WP_REST_Request $request) {
        try {
            $uid = $request['uid'];
            $abengine = new ABEngine();
            $campaign = $abengine->get_campaign_by_uid($uid);
            return rest_ensure_response(['status' => 'success', "campaign" => $campaign]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function update_campaign(WP_REST_Request $request) {
        try {
            $id = $request['campaign_id'];
            $abengine = new ABEngine();
            $data = $request->get_params();
            $campaign = $abengine->update_campaign($id, $data);
            return rest_ensure_response(['status' => 'success', "campaign" => $campaign]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function create_experiment(WP_REST_Request $request) {
        try {
            $abengine = new ABEngine();
            $data = $request->get_params();
            // Check that we have a uid
            if (!isset($data['uid'])) {
                throw new Exception("Missing uid!" . json_encode($data));
            }
            $experiment = $abengine->create_experiment($data);
            return rest_ensure_response(['status' => 'success', "experiment" => $experiment]);
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

    public function get_experiments(WP_REST_Request $request) {
        try {
            $id = $request['campaign_id'];
            $abengine = new ABEngine();
            $experiments = $abengine->get_experiments($id);
            return rest_ensure_response(['status' => 'success', "experiments" => $experiments]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }        
    }

    public function update_experiment(WP_REST_Request $request) {
        try {
            $id = $request['experiment_id'];
            $abengine = new ABEngine();
            $data = $request->get_params();
            $experiment = $abengine->update_experiment($id, $data);
            return rest_ensure_response(['status' => 'success', "experiment" => $experiment]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );            
        }
    }

    public function delete_experiment(WP_REST_Request $request) {
        try {
            $id = $request['experiment_id'];
            $abengine = new ABEngine();
            $experiment = $abengine->delete_experiment($id);
            return rest_ensure_response(['status' => 'success', "experiment" => $experiment]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );            
        }
    }

    public function update_experiments(WP_REST_Request $request) {
        try {
            $abengine = new ABEngine();
            $data = $request->get_params();
            $experiments = $abengine->update_experiments($data);
            return rest_ensure_response(['status' => 'success', "experiments" => $experiments]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );            
        }
    }
}