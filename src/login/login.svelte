<script>
    export let user_id = "";
</script>

<div class="wp_login_form">
    <h1>Log in to ABEngine</h1>
    <form name="loginform" id="loginform" action="https://abengine.local/wp-login.php" method="post">
        <p>
            <label for="user_login">Username or Email Address</label>
            <input type="text" name="log" id="user_login" class="input" value="" size="20" autocapitalize="off">
        </p>
        <p>
            <label for="user_pass">Password</label>
            <input type="password" name="pwd" id="user_pass" class="input" value="" size="20">
        </p>
        <p class="forgetmenot">
            <label for="rememberme"><input name="rememberme" type="checkbox" id="rememberme" value="forever"> Remember Me</label>
        </p>
        <p class="submit">
            <input type="submit" name="wp-submit" id="wp-submit" class="button button-primary button-large" value="Log In">
            <input type="hidden" name="redirect_to" value="https://abengine.local/wp-admin/">
            <input type="hidden" name="testcookie" value="1">
        </p>
    </form>
</div>