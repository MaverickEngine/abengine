<div class="wrap">
    <form method="post" action="options.php">
        <?php settings_fields( 'abengine-settings-group' ); ?>
        <?php do_settings_sections( 'abengine-settings-group' ); ?>
        <h1><?php _e( 'ABEngine Settings', 'abengine' ); ?></h1>
        <?php settings_errors(); ?>
        <hr>
        <table class="form-table">
            <tbody>
                <tr>
                    <th scope="row"><?php _e("ABEngine server", "abengine") ?></th>
                    <td>
                        <input type="text" name="abengine_server" value="<?php esc_attr_e(get_option('abengine_server')) ?>">
                        <div><?php _e("Enter the URL of your ABEngine server. Example: https://abengine.mydomain.com", "abengine") ?></div>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e("ABEngine API server", "abengine") ?></th>
                    <td>
                        <input type="text" name="abengine_api_server" value="<?php esc_attr_e(get_option('abengine_api_server')) ?>">
                        <div><?php _e("Enter the URL of your ABEngine API server. Example: https://abengine-api.mydomain.com", "abengine") ?></div>
                    </td>
                </tr>
                <?php
                    if (!defined('ABENGINE_APIKEY')) {
                ?>
                <tr>
                    <th scope="row"><?php _e("ABEngine API key", "abengine") ?></th>
                    <td>
                        <input type="password" name="abengine_apikey" value="<?php esc_attr_e($abengine_apikey) ?>">
                        <p>For better security, set this in your wp-config.php, vip-config.php or Docker .env file using the constant <code>ABENGINE_APIKEY</code>.<br /> Eg. <code>define("ABENGINE_APIKEY", "mykey12345");</code></p>
                    </td>
                </tr>
                <?php
                    }
                ?>
                <?php
                    if (!defined('ABENGINE_USER_ID')) {
                ?>
                <tr>
                    <th scope="row"><?php _e("ABEngine User ID", "abengine") ?></th>
                    <td>
                        <input type="text" name="abengine_user_id" value="<?php esc_attr_e($abengine_user_id) ?>">
                        <p>For better security, set this in your wp-config.php, vip-config.php or Docker .env file using the constant <code>ABENGINE_USER_ID</code>.<br /> Eg. <code>define("ABENGINE_USER_ID", "mykey12345");</code></p>
                    </td>
                </tr>
                <?php
                    }
                ?>
            </tbody>
        </table>
        <?php submit_button(); ?>
    </form>
</div>