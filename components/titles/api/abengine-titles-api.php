<?php

require_once(plugin_dir_path( dirname( __FILE__ ) ).'../../includes/lib/abengine.php');

class ABEngineTitlesAPI {
    public function __construct() {
        register_meta('post', 'abengine_title_campaign_id', array(
            'type' => 'string',
            'description' => 'The campaign ID for the AB Engine title campaigns',
            'single' => true,
            'show_in_rest' => true
        ));
        add_action( 'rest_api_init', array( $this, 'register_api_routes' ) );
    }

    public function register_api_routes() {
        register_rest_route('abengine/titles/v1/', '/post/(?P<post_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'check_post_abengine_title'),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ));
        register_rest_route('abengine/titles/v1/', '/post/(?P<post_id>\d+)', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_post_campaign'),
            'permission_callback' => function () {
                return current_user_can( 'edit_others_posts' );
            }
        ));
    }

    public function check_post_abengine_title(WP_REST_Request $request) {
        $post_id = $request['post_id'];
        try {
            $abengine = new ABEngine();
            $campaign_id = get_post_meta($post_id, 'abengine_title_campaign_id', true);
            if (!$campaign_id) {
                return new WP_Error('no_title_campaign', 'No title campaign found for this post', array('status' => 404));
            }
            $campaign = $abengine->get_campaign($campaign_id);
            return rest_ensure_response(['status' => 'ok', "campaign" => $campaign]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }
    
    public function create_post_campaign(WP_REST_Request $request) {
        $post_id = $request['post_id'];
        try {
            $abengine = new ABEngine();
            $data = $request->get_params();
            // Check that we have a uid
            if (!isset($data['uid'])) {
                $data['uid'] = "abengine-title-post-".$post_id;
            }
            $campaign = $abengine->create_campaign($data);
            update_post_meta($post_id, 'abengine_title_campaign_id', $campaign->data->_id);
            if (isset($data['title'])) {
                $abengine->create_experiment(array(
                    "campaign_id" => $campaign->data->_id,
                    "name" => "Title 1",
                    "uid" => "abengine-title-post-".$post_id."-1",
                    "value" => $data['title'],
                ));
            }
            return rest_ensure_response(['status' => 'success', "campaign" => $campaign]);
        } catch (Exception $e) {
            return new WP_Error( 'abengine_api_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }
}