<?php
class ABEngineAdminCampaigns {
    private $options = [
        
    ];

    public function __construct() {
        add_action('admin_menu', [ $this, 'campaigns_page' ]);
    }

    public function campaigns_page() {
        add_submenu_page(
            'abengine',
			'ABEngine Campaigns',
			'Campaigns',
			'manage_options',
			'abengine',
			[ $this, 'abengine_campaigns' ]
		);
    }

    public function abengine_campaigns() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.'));
        }
        $this->load_scripts();
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/campaigns.php';
    }

    protected function load_scripts() {
        wp_enqueue_script( "abengine-admin-campaigns", plugin_dir_url(__FILE__) . "../../dist/abengine-admin-campaigns.js", array( 'wp-api' ), ABENGINE_SCRIPT_VERSION, true );
        wp_localize_script( "abengine-admin-campaigns", "abengine", array(
            "restUrl" => rest_url('/abengine/v1/'),
            "nonce" => wp_create_nonce('wp_rest'),
        ) );
        wp_enqueue_style( "abengine-admin-campaigns", plugin_dir_url(__FILE__) . "../../dist/abengine-admin.css", array(), ABENGINE_SCRIPT_VERSION, "all");
    }
}