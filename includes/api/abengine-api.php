<?php

class ABEngineAPI {
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_api_routes' ) );
    }
    
    public function register_api_routes() {
        register_rest_route( 'abengine/v1', '/test', array(
            'methods' => 'POST',
            'callback' => array( $this, 'create_test' ),
        ) );
        register_rest_route( 'abengine/v1', '/test/(?P<test_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_test' ),
        ) );
        register_rest_route( 'abengine/v1', '/view/(?P<option_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'record_view' ),
        ) );
        register_rest_route( 'abengine/v1', '/win/(?P<option_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'record_win' ),
        ) );
        register_rest_route( 'abengine/v1', '/get_winner/(?P<test_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_winner' ),
        ) );
        register_rest_route( 'abengine/v1', '/serve/(?P<test_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'serve' ),
        ) );
    }

    public function create_test() {
        try {
            $data = json_decode( file_get_contents( 'php://input' ), true );
            $test = new ABTest();
            $test_id = $test->create($data['name'], $data['user_id'], $data['options'], $data['algorithm']);
            return rest_ensure_response(['status' => 'success', "test" => $test_id ]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function get_test($request) {
        try {
            $test = new ABTest($request['test_id']);
            return rest_ensure_response(['status' => 'success', "test" => $test->get_data()]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function record_view($request) {
        try {
            $option = new ABTestOption($request["option_id"]);
            $option->record_view();
            return rest_ensure_response(['status' => 'success']);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function record_win($request) {
        try {
            $option = new ABTestOption($request["option_id"]);
            $option->record_win();
            return rest_ensure_response(['status' => 'success']);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function get_winner($request) {
        try {
            $test = new ABTest($request["test_id"]);
            $arm = $test->get_winner();
            return rest_ensure_response(['status' => 'success', "arm" => $arm]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    public function serve($request) {
        try {
            $test = new ABTest($request["test_id"]);
            $arm = $test->serve();
            return rest_ensure_response(['status' => 'success', "arm" => $arm]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }
}