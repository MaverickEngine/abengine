<?php
/**
* Plugin Name: ABEngine
* Plugin URI: https://github.com/MaverickEngine/ab-engine
* Description: ABEngine is an API that supports other plugins to create and manage A/B tests. Brought to you by MavEngine, &lt;em&gt;Powering Media. 
* Author: MavEngine
* Author URI: https://mavengine.com
* Version: 0.0.1
* License: GPLv2 or later
* License URI: https://www.gnu.org/licenses/gpl-3.0.html
* WC requires at least: 5.8.0
* Tested up to: 6.0
*
*/
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const ABENGINE_SCRIPT_VERSION = "0.0.2";
const ABENGINE_DB_VERSION = "0.0.6";

function abengine_admin_init() {
    if (!is_admin()) {
        return;
    }
    require_once(plugin_basename('includes/admin/abengine-admin.php' ) );
    new ABEngineAdmin([]);
}
add_action( 'init', 'abengine_admin_init' );

function abengine_api_init() {
    require_once(plugin_dir_path( __FILE__ ) . 'includes/api/abengine-api.php' );
    new ABEngineAPI();
}
add_action( 'init', 'abengine_api_init' );

function abengine_client_init() {
    require_once( plugin_dir_path( __FILE__ ) . 'includes/client/abengine-client.php' );
    new ABEngineClient();
}
add_action( 'init', 'abengine_client_init', 3 );

// Setup database tables
function abengine_database_setup() {
    require_once( plugin_dir_path( __FILE__ ) . 'includes/db/abengine-db.php' );
    $abengine_db = new ABEngineDB();
    $abengine_db->setup();
}
add_action( 'init', 'abengine_database_setup', 2 );
