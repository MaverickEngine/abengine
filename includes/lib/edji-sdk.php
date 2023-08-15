<?php
class EdjiSDK {

    public function __construct($apikey, $api_server) {
        $this->apikey = $apikey;
        $this->api_server = $api_server;
    }

    protected function _handle_errors($response) {
        if (is_wp_error( $response ) ) {
            $error_message = $response->get_error_message();
            throw new Exception("ABEngine error: " . $error_message);
        }
        $code = wp_remote_retrieve_response_code($response);
        if ($code >= 400) {
            $body = wp_remote_retrieve_body($response);
            $body = json_decode($body);
            if (isset($body->message)) {
                throw new Exception("ABEngine error: " . $body->message);
            } else {
                throw new Exception("ABEngine error: " . $body);
            }
        }
    }

    protected function _decode_response($response) {
        $this->_handle_errors($response);
        $body = wp_remote_retrieve_body($response);
        $body = json_decode($body);
        return $body;
    }

    public function add_headers($data = null, $headers = array()) {
        $result = array(
            'headers' => array(
                'x-api-key' => $this->apikey,
                'Content-Type' => 'application/json',
            ),
        );
        if ($headers) {
            $result['headers'] = array_merge($result['headers'], $headers);
        }
        if ($data) {
            $result['body'] = wp_json_encode($data);
        }
        return $result;
    }

    public function get($endpoint, $params = []) {
        try {
            $endpoint = ltrim($endpoint, "/");
            $url = "{$this->api_server}/{$endpoint}";
            if (sizeof($params) > 0) {
                $url .= "?" . http_build_query($params);
            }
            $args = $this->add_headers();
        } catch (Exception $e) {
            throw new Exception("ABEngine error: " . $e->getMessage());
        }
        // error_log("ABEngine: GET $url");
        if (is_callable('vip_safe_wp_remote_get')) {
            $response = vip_safe_wp_remote_get($url, $args);
        } else {
            // phpcs:ignore
            $response = wp_remote_get($url, $args);
        }
        $this->_handle_errors($response);
        // error_log("ABEngine: GET response: " . print_r($response, true));
        return $this->_decode_response($response);
        // return $response;
    }

    public function post($endpoint, $data = []) {
        try {
            $endpoint = ltrim($endpoint, "/");
            $url = "{$this->api_server}/{$endpoint}";
            $args = $this->add_headers($data);
        } catch (Exception $e) {
            throw new Exception("ABEngine error: " . $e->getMessage());
        }
        if (is_callable('vip_safe_wp_remote_post')) {
            $response = vip_safe_wp_remote_post($url, $args);
        } else {
            // phpcs:ignore
            $response = wp_remote_post($url, $args);
        }
        $this->_handle_errors($response);
        return $this->_decode_response($response);
    }

    public function put($endpoint, $data = []) {
        try {
            $endpoint = ltrim($endpoint, "/");
            $url = "{$this->api_server}/{$endpoint}";
            $args = $this->add_headers($data);
        } catch (Exception $e) {
            throw new Exception("ABEngine error: " . $e->getMessage());
        }
        if (is_callable('vip_safe_wp_remote_put')) {
            $response = vip_safe_wp_remote_put($url, $args);
        } else {
            // phpcs:ignore
            $response = wp_remote_put($url, $args);
        }
        $this->_handle_errors($response);
        return $this->_decode_response($response);
    }
}