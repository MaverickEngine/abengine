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
    }

    public function create_test() {
        try {
            $data = json_decode( file_get_contents( 'php://input' ), true );
            $test = new ABTest();
            $test_id = $test->create($data['uid'], $data['name'], $data['user_id'], $data['options'], $data['algorithm']);
            return rest_ensure_response(['status' => 'success', "test_id" => $test_id, "uid" => $data['uid']]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }
}