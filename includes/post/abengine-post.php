<?php

class ABEnginePost {
    private function wpse_is_gutenberg_editor() { // https://wordpress.stackexchange.com/questions/309862/check-if-gutenberg-is-currently-in-use
        if( function_exists( 'is_gutenberg_page' ) && is_gutenberg_page() ) { 
            return true;
        }   
        
        $current_screen = get_current_screen();
        if ( method_exists( $current_screen, 'is_block_editor' ) && $current_screen->is_block_editor() ) {
            return true;
        }
        return false;
    }

    public function __construct() {
        add_action('admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
    }

    public function enqueue_scripts() {
        if (!in_array(get_post_type(), get_option('abengine_post_types'))) {
            return false;
        }
        wp_enqueue_script( "abengine-post-script", plugin_dir_url(__FILE__) . "../../dist/abengine-gutenberg.js", [], HEADLINEENGINE_SCRIPT_VERSION, true );
        wp_enqueue_style( "abengine-post-style", plugin_dir_url(__FILE__) . "../../dist/abengine-gutenberg.css", [], HEADLINEENGINE_SCRIPT_VERSION );
        $script = "var abengine_readability_range_min = " . intval(get_option('abengine_readability_range_min', 45)) . ";";
        $script .= "var abengine_readability_target = " . intval(get_option('abengine_readability_target', 55)) . ";";
        $script .= "var abengine_readability_range_max = " . intval(get_option('abengine_readability_range_max', 90)) . ";";
        $script .= "var abengine_length_range_min = " . intval(get_option('abengine_length_range_min', 40)) . ";";
        $script .= "var abengine_length_target = " . intval(get_option('abengine_length_target', 82)) . ";";
        $script .= "var abengine_length_range_max = " . intval(get_option('abengine_length_range_max', 90)) . ";";
        $script .= "var abengine_powerwords_api = '" . get_rest_url( null, "/abengine/v1/powerwords") . "';";
        $script .= "var abengine_reading_grade_target = " . intval(get_option('abengine_reading_grade_target', 7)) . ";";
        $script .= "var abengine_reading_grade_range_min = " . intval(get_option('abengine_reading_grade_range_min', 5)) . ";";
        $script .= "var abengine_reading_grade_range_max = " . intval(get_option('abengine_reading_grade_range_max', 12)) . ";";
        $script .= "var abengine_wordcount_target = " . intval(get_option('abengine_wordcount_target', 200)) . ";";
        $script .= "var abengine_wordcount_range_min = " . intval(get_option('abengine_wordcount_range_min', 100)) . ";";
        $script .= "var abengine_wordcount_range_max = " . intval(get_option('abengine_wordcount_range_max', 300)) . ";";
        $script .= "var abengine_readability_enable = " . (get_option('abengine_readability_enable') ? 'true' : 'false') . ";";
        $script .= "var abengine_length_enable = " . (get_option('abengine_length_enable') ? 'true' : 'false') . ";";
        $script .= "var abengine_powerwords_enable = " . (get_option('abengine_powerwords_enable') ? 'true' : 'false') . ";";
        $script .= "var abengine_reading_grade_enable = " . (get_option('abengine_reading_grade_enable') ? 'true' : 'false') . ";";
        $script .= "var abengine_wordcount_enable = " . (get_option('abengine_wordcount_enable') ? 'true' : 'false') . ";";
        wp_add_inline_script('abengine-post-script', $script, 'before');
    }

}