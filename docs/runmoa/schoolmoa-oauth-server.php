<?php

/**
 * Plugin Name: Schoolmoa OAuth Server
 * Plugin URI: https://www.cosmosfarm.com/
 * Description: Schoolmoa OAuth Server
 * Version: 0.1
 * Author: cosmosfarm
 * Author URI: https://www.cosmosfarm.com/
 **/
class Schoolmoa_Oauth_server
{
	public function __construct()
	{
		// register_rest_route('oauth', '/client-login', array( 'methods' => 'GET', 'callback' => array($this, 'client_login_request'), 'permission_callback' => '__return_true' ));
		register_rest_route('oauth', '/token-issue', array('methods' => 'GET', 'callback' => array($this, 'token_issue'), 'permission_callback' => '__return_true'));
		register_rest_route('oauth', '/user-info', array('methods' => 'GET', 'callback' => array($this, 'get_user_info_by_token'), 'permission_callback' => '__return_true'));
		register_rest_route('oauth', '/user-duplicate-check', array('methods' => 'POST', 'callback' => array($this, 'user_duplicate_check'), 'permission_callback' => '__return_true'));
		register_rest_route('oauth', '/user-register', array('methods' => 'POST', 'callback' => array($this, 'user_register'), 'permission_callback' => '__return_true'));
	}

	/**
	 * 클라이언트 로그인 요청을 처리한다.
	 * @return WP_REST_Response
	 */
	// public function client_login_request(WP_REST_Request $request) {
	// 	$headers = $request->get_headers();
	// 	$authorization_header = isset($headers['authorization']) ? $headers['authorization'] : '';
	// 	$client_secret = $this->get_client_secret($authorization_header);
	// 	if (empty($client_secret)) {
	// 		return new WP_REST_Response(array('result' => 'fail' , 'msg' => 'empty client_secret error'), 401);
	// 	}
	// 	$client_id = $request->get_param('client_id');
	// 	$redirect_uri = $request->get_param('redirect_uri');

	// 	if (empty($client_id) || empty($client_secret) || empty($redirect_uri)) {
	// 		return new WP_REST_Response(array('result' => 'fail' , 'msg' => 'empty client_id or client_secret or redirect_uri empty error'), 401);
	// 	}

	// 	global $wpdb;
	// 	$client_check = $wpdb->get_row(
	// 		"SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_client WHERE `ID` = 1",
	// 	);
	// 	$client_id_check = $client_check->client_id;
	// 	$client_secret_check = $client_check->client_secret;

	// 	if ($client_id == $client_id_check && $client_secret == $client_secret_check) {
	// 		$redirect_link = home_url() . '/login/?redirect_uri=' . $redirect_uri . '&client_id=' . $client_id;
	// 		return new WP_REST_Response(array('result' => 'success', 'link' => $redirect_link), 200);
	// 	} else {
	// 		return new WP_REST_Response(array('result' => 'fail' , 'msg' => 'client or client_secret match error'), 401);
	// 	}
	// }

	/**
	 * 토큰 발급 요청을 처리한다.
	 * @return WP_REST_Response
	 */
	public function token_issue(WP_REST_Request $request)
	{
		$headers              = $request->get_headers();
		$authorization_header = isset($headers['authorization']) ? $headers['authorization'] : '';

		$client_secret        = $this->get_client_secret($authorization_header);
		if (empty($client_secret)) {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => 'empty client_secret error'), 401);
		}

		$client_id          = $request->get_param('client_id');
		$authorization_code = $request->get_param('code');
		$lang               = $request->get_param('lg');

		if (empty($client_id) || empty($authorization_code) || empty($client_secret)) {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => 'empty client_id or code or client_secret empty error'), 401);
		}

		// 24.10.21 추가
		$langs = [
			'kr' => '1',
			'en' => '2',
			'jp' => '3',
		];
		if (isset($langs[$lang])) {
			switch_to_blog($langs[$lang]);
		}

		global $wpdb;

		$client_check = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_client WHERE `client_id` = %s", $client_id));
		$client_id_check = $client_check->client_id;
		$client_secret_check = $client_check->client_secret;

		if ($client_id == $client_id_check && $client_secret == $client_secret_check) {
			$authorization_code_info = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_token WHERE `authorization_code` = %s AND `client_id` = %s",
					$authorization_code,
					$client_id
				)
			);
			if (empty($authorization_code_info)) {
				return new WP_REST_Response(array('result' => 'fail', 'msg' => 'authorization_code not found error'), 401);
			} else {

				if (strtotime($authorization_code_info->authorization_code_expires) < strtotime(date('Y-m-d H:i:s'))) {
					return new WP_REST_Response(array('result' => 'fail', 'msg' => 'authorization_code validity period expires'), 401);
				} else {
					$bytes = random_bytes(32);
					$access_token = bin2hex($bytes);
					$access_token_expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
					$wpdb->update(
						$wpdb->prefix . 'schoolmoa_oauth_token',
						array(
							'access_token' => $access_token,
							'access_token_expires' => $access_token_expires,
							'authorization_code' => null,
							'authorization_code_expires' => null,
						),
						array(
							'ID' => $authorization_code_info->ID
						)
					);

					return new WP_REST_Response(array('result' => 'success', 'access_token' => $access_token, 'expires_in' => 3600), 200);
				}
			}
		} else {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => 'client or client_secret match error'), 401);
		}
	}

	/**
	 * 토큰을 이용하여 사용자 정보를 반환한다.
	 * @return WP_REST_Response
	 */

	public function get_user_info_by_token(WP_REST_Request $request)
	{
		$headers              = $request->get_headers();
		$authorization_header = isset($headers['authorization']) ? $headers['authorization'] : '';

		$lang         = $request->get_param('lg');
		$access_token = $this->get_bearer_token($authorization_header);
		if (empty($access_token)) {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => 'empty access_token error'), 401);
		}

		// 24.10.21 추가
		$langs = [
			'kr' => '1',
			'en' => '2',
			'jp' => '3',
		];
		if (isset($langs[$lang])) {
			switch_to_blog($langs[$lang]);
		}

		global $wpdb;
		$token_info = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_token WHERE `access_token` = %s",
				$access_token
			)
		);

		if (empty($token_info)) {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => 'access_token not found error'), 401);
		} else {
			if (strtotime($token_info->access_token_expires) < strtotime(date('Y-m-d H:i:s'))) {
				return new WP_REST_Response(array('result' => 'fail', 'msg' => 'access_token validity period expires'), 401);
			} else {
				$user_info = get_userdata($token_info->user_id);
				// $auth_user_id = get_user_meta($token_info->user_id, 'auth_user_id', true);
				$user_id = $token_info->user_id;
				$auth_user_id = $wpdb->get_var(
					$wpdb->prepare(
						"SELECT meta_value FROM wp_usermeta WHERE user_id = %d AND meta_key = %s LIMIT 1",
						$user_id,
						'auth_user_id'
					)
				);

				if (empty($auth_user_id)) {
					$hash_random_bytes = hash('sha512', random_bytes(32));
					$hash_random_bytes = hash('sha512', $hash_random_bytes . uniqid());
					$hash_random_bytes = hash('sha512', $hash_random_bytes . random_bytes(32));
					$md5_hash_random_bytes = md5($hash_random_bytes);
					update_user_meta($user_info->ID, 'auth_user_id', $md5_hash_random_bytes);
					$auth_user_id = $md5_hash_random_bytes;
				}

				$social_channel  = get_user_meta($user_id, 'cosmosfarm_members_social_channel', true) ?? '';
				$marketing_agree = (get_user_meta($user_id, 'runmoa_marketing_agree', true) === 'yes') ? 'Y' : 'N';

				$user_phone = get_user_meta($user_info->ID, 'billing_phone', true);
				$user_phone = str_replace(' ', '', $user_phone);
				$user_phone = str_replace('+82', '0', $user_phone);
				$user_phone = str_replace('-', '', $user_phone);

				return new WP_REST_Response(array('result' => 'success', 'user_id' => $user_info->ID, 'id' => $auth_user_id, 'user_name' => $user_info->display_name, 'user_email' => $user_info->user_email, 'user_phone' => $user_phone, 'social_channel' => $social_channel, 'marketing_agree' => $marketing_agree), 200);
			}
		}
	}

	/**
	 * 사용자 중복 체크 요청을 처리한다.
	 * @return WP_REST_Response
	 */

	public function user_duplicate_check(WP_REST_Request $request)
	{
		$user_email = $request->get_param('user_email');
		$user_phone = $request->get_param('user_phone');
		$nonce = $request->get_param('schoolmoa_nonce');
		if ($nonce != 'schoolmoa_119') {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => '잘못된 접근입니다.'), 401);
		}

		$user_info = get_user_by('email', $user_email);
		global $wpdb;
		$user_info_phone = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}usermeta WHERE `meta_key` = 'billing_phone' AND `meta_value` = %s",
				$user_phone
			)
		);
		if ($user_info) {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => '이미 등록된 이메일입니다.'), 401);
		} else if ($user_info_phone) {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => '이미 등록된 전화번호입니다.'), 401);
		} else {
			return new WP_REST_Response(array('result' => 'success', 'msg' => '사용가능한 이메일입니다.'), 200);
		}
	}



	/**
	 * 사용자 등록 요청을 처리한다.
	 * @return WP_REST_Response
	 */

	public function user_register(WP_REST_Request $request)
	{
		$user_email = $request->get_param('user_email');
		$user_pass = $request->get_param('user_pass');
		$user_name = $request->get_param('user_name');
		$user_phone = $request->get_param('user_phone');
		$schoolmoa_client_id = $request->get_param('schoolmoa_client_id');
		$nonce = $request->get_param('schoolmoa_nonce');
		if ($nonce != 'schoolmoa_112') {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => '잘못된 접근입니다.'), 401);
		}
		$wp_user_id = wp_insert_user(
			array(
				'user_login' => $user_email,
				'user_pass' => $user_pass,
				'user_email' => $user_email,
				'display_name' => $user_name,
			)
		);
		if (is_wp_error($wp_user_id)) {
			return new WP_REST_Response(array('result' => 'fail', 'msg' => '회원등록중 오류가 발생했습니다 관리자에게 문의해주세요'), 401);
		} else {
			update_user_meta($wp_user_id, 'billing_phone', $user_phone);
			update_user_meta($wp_user_id, 'join_path', '직접입력');
			delete_user_meta($wp_user_id, 'verify_email');
			delete_user_meta($wp_user_id, 'wait_verify_email');
			delete_user_meta($wp_user_id, 'send_verify_email_time');

			$hash_random_bytes = hash('sha512', random_bytes(32));
			$hash_random_bytes = hash('sha512', $hash_random_bytes . uniqid());
			$hash_random_bytes = hash('sha512', $hash_random_bytes . random_bytes(32));
			$md5_hash_random_bytes = md5($hash_random_bytes);
			update_user_meta($wp_user_id, 'auth_user_id', $md5_hash_random_bytes);
			$auth_user_id = $md5_hash_random_bytes;
			global $wpdb;
			$wpdb->insert(
				$wpdb->prefix . 'schoolmoa_oauth_login',
				array(
					'user_id' => $wp_user_id,
					'client_id' => $schoolmoa_client_id,
					'login_time' => current_time('mysql'),
					'user_agree' => 'Y',
				)

			);
			return new WP_REST_Response(array('result' => 'success', 'msg' => '회원이 등록되었습니다', 'channel_id' => $auth_user_id), 200);
		}
	}

	/**
	 *  header의 Authorization 을 추출한다.
	 *  @return string|null
	 */
	public function getAuthorizationHeader()
	{
		$headers = null;
		if (isset($_SERVER['Authorization'])) {
			$headers = trim($_SERVER["Authorization"]);
		} else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
			$headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
		} elseif (function_exists('apache_request_headers')) {
			$requestHeaders = apache_request_headers();
			// Server-side fix for bug in old Android versions (a nice side-effect of this fix means we don't care about capitalization for Authorization)
			$requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
			if (isset($requestHeaders['Authorization'])) {
				$headers = trim($requestHeaders['Authorization']);
			}
		}
		return $headers;
	}

	/**
	 * Bearer 토큰을 추출한다.
	 * @return string|null
	 */
	public function get_bearer_token()
	{
		$headers = $this->getAuthorizationHeader();
		if (!empty($headers)) {
			if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
				return $matches[1];
			}
		}
		return null;
	}

	/**
	 * client_secret 을 추출한다
	 * @return string|null
	 */

	public function get_client_secret()
	{
		$headers = $this->getAuthorizationHeader();
		if (!empty($headers)) {
			if (preg_match('/client_secret\s+(\S+)/', $headers, $matches)) {
				return $matches[1];
			}
		}
		return null;
	}
}
add_action('rest_api_init', function () {
	new Schoolmoa_Oauth_server();
});
add_filter('rest_url_prefix', function () {
	return 'api';
});


/**
 * 로그인된 유저는 검증을 거쳐 코드를 발급한다
 */

add_action('init', function () {

	// 관리자 권한 위임 위해추가 
	if (isset($_GET['wp_user_id']) && $_GET['client_id'] && $_GET['redirect_uri'] && $_GET['verify_key'] ) {
		$wp_user_id = intval($_GET['wp_user_id']);
		$client_id = sanitize_text_field($_GET['client_id']);
		$redirect_uri = sanitize_text_field($_GET['redirect_uri']);
		$lang = isset($_GET['lg']) ? sanitize_text_field($_GET['lg']) : 'kr';
		$verify_key = sanitize_text_field($_GET['verify_key']);

		$api_url = 'https://web01.runmoa.com/api/wp/admin-check-key';

		$response = wp_remote_post($api_url, array(
			'body' => array(
				'verify_key' => $verify_key,
				'wp_user_id' => $wp_user_id,
				'client_id' => $client_id,
			),
		));

		$response_code = wp_remote_retrieve_response_code($response);

		if( $response_code == 200 ){
			$langs = [
				'kr' => '1',
				'en' => '2',
				'jp' => '3',
			];

			if (isset($langs[$lang])) {
				switch_to_blog($langs[$lang]);
			}

			global $wpdb;
			$client_check = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_client WHERE `client_id` = %s",
					$client_id
				)
			);

			$client_id_check = $client_check->client_id;

			if ($client_id == $client_id_check) {
				$bytes = random_bytes(32);
				$authorization_code = bin2hex($bytes);
				$authorization_code_expires = date('Y-m-d H:i:s', strtotime('+3 minutes'));
				$user_code_check = $wpdb->get_var(
					$wpdb->prepare(
						"SELECT `ID` FROM {$wpdb->prefix}schoolmoa_oauth_token WHERE `user_id` = %d AND `client_id` = %s",
						$wp_user_id,
						$client_id
					)
				);

				if (isset($user_code_check)) {
					$wpdb->update(
						$wpdb->prefix . 'schoolmoa_oauth_token',
						array(
							'authorization_code' => $authorization_code,
							'authorization_code_expires' => $authorization_code_expires,
						),
						array(
							'ID' => $user_code_check
						)
					);
				} else {
					$wpdb->insert(
						$wpdb->prefix . 'schoolmoa_oauth_token',
						array(
							'user_id' => $wp_user_id,
							'client_id' => $client_id,
							'authorization_code' => $authorization_code,
							'authorization_code_expires' => $authorization_code_expires,
						)
					);
				}

				$redirect_url = add_query_arg(
					array(
						'code' => $authorization_code,
						'accept' => 'Y',
					),
					$redirect_uri
				);
				wp_redirect($redirect_url);
				exit;
			}
		}

	}

	if (isset($_GET['redirect_uri']) && isset($_GET['client_id'])) {
		if (is_user_logged_in()) {
			$redirect_uri = sanitize_text_field($_GET['redirect_uri']);
			$client_id    = sanitize_text_field($_GET['client_id']);
			$user_id      = get_current_user_id();

			// 휴대폰번호 체크
			$billing_phone = get_user_meta($user_id, 'billing_phone', true);
			if (empty($billing_phone)) {
				$url = esc_url( home_url('/myaccount/?a=edit') );
				echo '<script>alert("필수 정보를 입력해 주세요."); window.location.href = "'. $url .'";</script>';
				exit;
			}

			$lang		  = isset($_GET['lg']) ? sanitize_text_field($_GET['lg']) : 'kr';
			// 24.10.22 추가
			$langs = [
				'kr' => '1',
				'en' => '2',
				'jp' => '3',
			];
			if (isset($langs[$lang])) {
				switch_to_blog($langs[$lang]);
			}

			$uid = isset($_GET['uid']) ? intval($_GET['uid']) : 0;
			if ($uid && current_user_can('edit_posts')) {
				$user_id = $uid;
			}

			$user_id = intval($user_id);

			global $wpdb;
			$client_check = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_client WHERE `client_id` = %s",
					$client_id
				)
			);
			$client_id_check = $client_check->client_id;

			if ($client_id == $client_id_check) {
				$user_auth_agree = $wpdb->get_var(
					$wpdb->prepare(
						"SELECT `ID` FROM {$wpdb->prefix}schoolmoa_oauth_login WHERE `user_id` = %d AND `client_id` = %s",
						$user_id,
						$client_id
					)
				);

				if(!$user_auth_agree){
					$wpdb->insert(
						$wpdb->prefix . 'schoolmoa_oauth_login',
						array(
							'user_id' => $user_id,
							'client_id' => $client_id,
							'login_time' => current_time('mysql'),
							'user_agree' => 'Y',
						)
					);
				} else {
					$wpdb->update(
						$wpdb->prefix . 'schoolmoa_oauth_login',
						array(
							'login_time' => current_time('mysql'),
						),
						array(
							'ID' => $user_auth_agree
						)
					);
				}

				# 동의항목 삭제
				// if (!empty ($user_auth_agree)) {
				// $wpdb->update(
				// 	$wpdb->prefix . 'schoolmoa_oauth_login',
				// 	array(
				// 		'login_time' => current_time('mysql'),
				// 	),
				// 	array(
				// 		'ID' => $user_auth_agree
				// 	)
				// );

				$bytes = random_bytes(32);
				$authorization_code = bin2hex($bytes);
				$authorization_code_expires = date('Y-m-d H:i:s', strtotime('+3 minutes'));
				$user_code_check = $wpdb->get_var(
					$wpdb->prepare(
						"SELECT `ID` FROM {$wpdb->prefix}schoolmoa_oauth_token WHERE `user_id` = %d AND `client_id` = %s",
						$user_id,
						$client_id
					)
				);
				if (isset($user_code_check)) {
					$wpdb->update(
						$wpdb->prefix . 'schoolmoa_oauth_token',
						array(
							'authorization_code' => $authorization_code,
							'authorization_code_expires' => $authorization_code_expires,
						),
						array(
							'ID' => $user_code_check
						)
					);
				} else {
					$wpdb->insert(
						$wpdb->prefix . 'schoolmoa_oauth_token',
						array(
							'user_id' => $user_id,
							'client_id' => $client_id,
							'authorization_code' => $authorization_code,
							'authorization_code_expires' => $authorization_code_expires,
						)
					);
				}


				$runmoa_email = sanitize_text_field($_GET['email']);
				if ($runmoa_email) {
					$redirect_url = add_query_arg(
						array(
							'code'  => $authorization_code,
							'email' => $runmoa_email
						),
						$redirect_uri
					);
				} else {
					$redirect_url = add_query_arg('code', $authorization_code, $redirect_uri);
				}

				wp_redirect($redirect_url);
				exit;
				// } else {
				// 	ob_start();
				// 	include 'schoolmoa-oauth-agreeform.php';
				// 	echo ob_get_clean();
				// 	exit;
				// }
			}
		} else {
			// 세션 저장
			$_SESSION['schoolmoa_redirect_uri'] = sanitize_text_field($_GET['redirect_uri']);
			$_SESSION['schoolmoa_client_id'] = sanitize_text_field($_GET['client_id']);
			$_SESSION['schoolmoa_lg'] = isset($_GET['lg']) ? sanitize_text_field($_GET['lg']) : 'kr';
		}
	}
});

/**
 * 로그인했을때 검증후 코드를 발급한다
 */

add_action('wp_login', function ($user_login, $user) {
	$user_id = intval($user->ID);

	$user_id = $user->ID;
	$billing_phone = get_user_meta($user_id, 'billing_phone', true);
	if (empty($billing_phone)) {
		$url = esc_url( home_url('/myaccount/?a=edit') );
		echo '<script>alert("필수 정보를 입력해 주세요."); window.location.href = "'. $url .'";</script>';
		exit;
	}

	$redirect_uri = isset($_GET['redirect_uri']) ? sanitize_text_field($_GET['redirect_uri']) : '';
	$client_id    = isset($_GET['client_id'])    ? sanitize_text_field($_GET['client_id'])    : '';
	$lang         = isset($_GET['lg'])           ? sanitize_text_field($_GET['lg'])           : 'kr';

	$session_redirect_uri = isset($_SESSION['schoolmoa_redirect_uri']) ? sanitize_text_field($_SESSION['schoolmoa_redirect_uri']) : '';
	$session_client_id    = isset($_SESSION['schoolmoa_client_id'])    ? sanitize_text_field($_SESSION['schoolmoa_client_id'])    : '';
	$session_lg           = isset($_SESSION['schoolmoa_lg'])           ? sanitize_text_field($_SESSION['schoolmoa_lg'])           : 'kr';

	// 24.10.22 추가
	$langs = [
		'kr' => '1',
		'en' => '2',
		'jp' => '3',
	];

	if (!empty($redirect_uri) && !empty($client_id)) {
		if (isset($langs[$lang])) {
			switch_to_blog($langs[$lang]);
		}

		global $wpdb;
		$client_check = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_client WHERE `client_id` = %s",
				$client_id
			)
		);

		$client_id_check = $client_check->client_id;

		if ($client_id == $client_id_check) {
			$user_auth_agree = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT `ID` FROM {$wpdb->prefix}schoolmoa_oauth_login WHERE `user_id` = %d AND `client_id` = %s",
					$user_id,
					$client_id
				)
			);

			if(!$user_auth_agree){
				$wpdb->insert(
					$wpdb->prefix . 'schoolmoa_oauth_login',
					array(
						'user_id' => $user_id,
						'client_id' => $client_id,
						'login_time' => current_time('mysql'),
						'user_agree' => 'Y',
					)
				);
			} else {
				$wpdb->update(
					$wpdb->prefix . 'schoolmoa_oauth_login',
					array(
						'login_time' => current_time('mysql'),
					),
					array(
						'ID' => $user_auth_agree
					)
				);
			}

			# 동의항목 삭제
			// if (!empty ($user_auth_agree)) {
			$bytes = random_bytes(32);
			$authorization_code = bin2hex($bytes);
			$authorization_code_expires = date('Y-m-d H:i:s', strtotime('+3 minutes'));
			$user_code_check = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT `ID` FROM {$wpdb->prefix}schoolmoa_oauth_token WHERE `user_id` = %d AND `client_id` = %s",
					$user_id,
					$client_id
				)
			);

			if (isset($user_code_check)) {
				$wpdb->update(
					$wpdb->prefix . 'schoolmoa_oauth_token',
					array(
						'authorization_code' => $authorization_code,
						'authorization_code_expires' => $authorization_code_expires,
					),
					array(
						'ID' => $user_code_check
					)
				);
			} else {
				$wpdb->insert(
					$wpdb->prefix . 'schoolmoa_oauth_token',
					array(
						'user_id' => $user_id,
						'client_id' => $client_id,
						'authorization_code' => $authorization_code,
						'authorization_code_expires' => $authorization_code_expires,
					)
				);
			}

			$wpdb->update(
				$wpdb->prefix . 'schoolmoa_oauth_login',
				array(
					'login_time' => current_time('mysql'),
				),
				array(
					'ID' => $user_auth_agree
				)
			);

			// 관리자 권한 위임 위해 추가
			$runmoa_email = sanitize_text_field($_GET['email']);

			if ($runmoa_email) {
				$redirect_url = add_query_arg(
					array(
						'code'  => $authorization_code,
						'email' => $runmoa_email
					),
					$redirect_uri
				);
			} else {
				$redirect_url = add_query_arg('code', $authorization_code, $redirect_uri);
			}

			wp_redirect($redirect_url);
			exit;
		} else {
			$redirect_url = add_query_arg('error', 'clientecoderror', $redirect_uri);
			wp_redirect($redirect_url);
			exit;
		}
		//  카카오 로그인 때문에 급하게 추가
	} else if (!empty($session_redirect_uri) && !empty($session_client_id)) {
		$redirect_uri = $session_redirect_uri;
		$client_id    = $session_client_id;
		$lang         = $session_lg;

		if (isset($langs[$lang])) {
			switch_to_blog($langs[$lang]);
		}

		global $wpdb;
		$client_check = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_client WHERE `client_id` = %s",
				$client_id
			)
		);
		$client_id_check = $client_check->client_id;

		if ($client_id == $client_id_check) {
			$user_auth_agree = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT `ID` FROM {$wpdb->prefix}schoolmoa_oauth_login WHERE `user_id` = %d AND `client_id` = %s",
					$user_id,
					$client_id
				)
			);
			# 동의항목 삭제
			// if (!empty ($user_auth_agree)) {
			$bytes = random_bytes(32);
			$authorization_code = bin2hex($bytes);
			$authorization_code_expires = date('Y-m-d H:i:s', strtotime('+3 minutes'));
			$user_code_check = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT `ID` FROM {$wpdb->prefix}schoolmoa_oauth_token WHERE `user_id` = %d AND `client_id` = %s",
					$user_id,
					$client_id
				)
			);

			if (isset($user_code_check)) {
				$wpdb->update(
					$wpdb->prefix . 'schoolmoa_oauth_token',
					array(
						'authorization_code' => $authorization_code,
						'authorization_code_expires' => $authorization_code_expires,
					),
					array(
						'ID' => $user_code_check
					)
				);
			} else {
				$wpdb->insert(
					$wpdb->prefix . 'schoolmoa_oauth_token',
					array(
						'user_id' => $user_id,
						'client_id' => $client_id,
						'authorization_code' => $authorization_code,
						'authorization_code_expires' => $authorization_code_expires,
					)
				);
			}

			$wpdb->update(
				$wpdb->prefix . 'schoolmoa_oauth_login',
				array(
					'login_time' => current_time('mysql'),
				),
				array(
					'ID' => $user_auth_agree
				)
			);

			$redirect_url = add_query_arg('code', $authorization_code, $redirect_uri);
			// 세션삭제
			unset($_SESSION['schoolmoa_redirect_uri']);
			unset($_SESSION['schoolmoa_client_id']);
			unset($_SESSION['schoolmoa_lg']);
			wp_redirect($redirect_url);
			exit;
		} else {
			$redirect_url = add_query_arg('error', 'clientecoderror', $redirect_uri);
			wp_redirect($redirect_url);
			exit;
		}
	}
}, 1, 2);

/**
 * 사용자 동의 후 코드를 발급한다
 */
add_action('admin_post_schoolmoa_auth_agree', 'schoolmoa_auth_agree');
add_action('admin_post_nopriv_schoolmoa_auth_agree', 'schoolmoa_auth_agree');
function schoolmoa_auth_agree()
{
	$user_id = sanitize_text_field($_POST['user_id']);
	$current_user_id = get_current_user_id();
	$client_id = sanitize_text_field($_POST['client_id']);
	if ($user_id != $current_user_id) {
		wp_die('잘못된 접근입니다.');
		exit;
	}

	wp_verify_nonce('schoolmoa_security_' . $user_id, 'schoolmoa_nonce');
	$redirect_uri = sanitize_text_field($_POST['redirect_uri']);
	$personal_info = isset($_POST['personal_info']) ? sanitize_text_field($_POST['personal_info']) : '';
	$service_use = isset($_POST['service_use']) ? sanitize_text_field($_POST['service_use']) : '';

	if ($personal_info !== 'Y' || $service_use !== 'Y') {
		wp_die('잘못된 접근입니다.');
		exit;
	}
	global $wpdb;
	$client_check = $wpdb->get_row(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}schoolmoa_oauth_client WHERE `client_id` = %s",
			$client_id
		)
	);
	$client_id_check = $client_check->client_id;
	if ($client_id == $client_id_check) {
		$wpdb->insert(
			$wpdb->prefix . 'schoolmoa_oauth_login',
			array(
				'user_id' => $user_id,
				'client_id' => $client_id,
				'login_time' => current_time('mysql'),
				'user_agree' => 'Y',
			)
		);
		$bytes = random_bytes(32);
		$authorization_code = bin2hex($bytes);
		$authorization_code_expires = date('Y-m-d H:i:s', strtotime('+3 minutes'));
		$user_code_check = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT `ID` FROM {$wpdb->prefix}schoolmoa_oauth_token WHERE `user_id` = %d AND `client_id` = %s",
				$user_id,
				$client_id
			)
		);
		if (isset($user_code_check)) {
			$wpdb->update(
				$wpdb->prefix . 'schoolmoa_oauth_token',
				array(
					'client_id' => $client_id,
					'authorization_code' => $authorization_code,
					'authorization_code_expires' => $authorization_code_expires,
				),
				array(
					'ID' => $user_code_check
				)
			);
		} else {
			$wpdb->insert(
				$wpdb->prefix . 'schoolmoa_oauth_token',
				array(
					'user_id' => $user_id,
					'client_id' => $client_id,
					'authorization_code' => $authorization_code,
					'authorization_code_expires' => $authorization_code_expires,
				)
			);
		}
		$redirect_url = add_query_arg('code', $authorization_code, $redirect_uri);
		wp_redirect($redirect_url);
		exit;
	} else {
		wp_die('잘못된 접근입니다.');
		exit;
	}
}

/**
 * 플러그인 활성화시 테이블 생성
 */
register_activation_hook(__FILE__, 'schoolmoa_oauth_plugin_activation');
function schoolmoa_oauth_plugin_activation()
{
	global $wpdb;
	$charset_collate = $wpdb->get_charset_collate();
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';

	// 멀티사이트 체크
	if (is_multisite()) {
		// 모든 사이트를 순회하며 테이블 생성
		$sites = get_sites();
		foreach ($sites as $site) {
			// 각 사이트의 블로그 ID 가져오기
			$blog_id = $site->blog_id;

			// 각 사이트의 테이블 프리픽스 가져오기
			$table_prefix = $wpdb->get_blog_prefix($blog_id);

			// 사이트 전환
			switch_to_blog($blog_id);

			// 코드와 토큰 테이블
			$sql = "CREATE TABLE {$table_prefix}schoolmoa_oauth_token (
				`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				`user_id` int(11) NOT NULL,
				`client_id` varchar(255) NOT NULL,
				`authorization_code` varchar(255) NULL,
				`authorization_code_expires` datetime NULL,
				`access_token` varchar(255) NULL,
				`access_token_expires` datetime NULL,
				PRIMARY KEY  (ID),
				KEY `user_id` (`user_id`),
				KEY `client_id` (`client_id`),
				KEY `authorization_code` (`authorization_code`),
				KEY `access_token` (`access_token`)
			) $charset_collate;";
			dbDelta($sql);

			// 클라이언트 secret 테이블
			$sql = "CREATE TABLE {$table_prefix}schoolmoa_oauth_client (
				`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				`user_id` int(11) NOT NULL,
				`client_name` varchar(255) NOT NULL,
				`client_host` varchar(255) NOT NULL,
				`client_id` varchar(255) NOT NULL,
				`client_secret` varchar(255) NOT NULL,
				PRIMARY KEY  (ID),
				KEY `user_id` (`user_id`),
				KEY `client_id` (`client_id`),
				KEY `client_name` (`client_name`),
				KEY `client_host` (`client_host`)
			) $charset_collate;";
			dbDelta($sql);

			// 로그인 정보 테이블
			$sql = "CREATE TABLE {$table_prefix}schoolmoa_oauth_login (
				`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				`user_id` int(11) NOT NULL,
				`user_agree` varchar(255) NOT NULL,
				`client_id` varchar(255) NOT NULL,
				`login_time` datetime NOT NULL,
				PRIMARY KEY  (ID),
				KEY `user_id` (`user_id`),
				KEY `client_id` (`client_id`)
			) $charset_collate;";
			dbDelta($sql);

			// 사이트 전환 해제
			restore_current_blog();
		}
	} else {
		// 단일 사이트 환경일 경우 기본 프리픽스를 사용하여 테이블 생성
		$table_prefix = $wpdb->prefix;

		// 코드와 토큰 테이블
		$sql = "CREATE TABLE {$table_prefix}schoolmoa_oauth_token (
			`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			`user_id` int(11) NOT NULL,
			`client_id` varchar(255) NOT NULL,
			`authorization_code` varchar(255) NULL,
			`authorization_code_expires` datetime NULL,
			`access_token` varchar(255) NULL,
			`access_token_expires` datetime NULL,
			PRIMARY KEY  (ID),
			KEY `user_id` (`user_id`),
			KEY `client_id` (`client_id`),
			KEY `authorization_code` (`authorization_code`),
			KEY `access_token` (`access_token`)
		) $charset_collate;";
		dbDelta($sql);

		// 클라이언트 secret 테이블
		$sql = "CREATE TABLE {$table_prefix}schoolmoa_oauth_client (
			`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			`user_id` int(11) NOT NULL,
			`client_name` varchar(255) NOT NULL,
			`client_host` varchar(255) NOT NULL,
			`client_id` varchar(255) NOT NULL,
			`client_secret` varchar(255) NOT NULL,
			PRIMARY KEY  (ID),
			KEY `user_id` (`user_id`),
			KEY `client_id` (`client_id`),
			KEY `client_name` (`client_name`),
			KEY `client_host` (`client_host`)
		) $charset_collate;";
		dbDelta($sql);

		// 로그인 정보 테이블
		$sql = "CREATE TABLE {$table_prefix}schoolmoa_oauth_login (
			`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			`user_id` int(11) NOT NULL,
			`user_agree` varchar(255) NOT NULL,
			`client_id` varchar(255) NOT NULL,
			`login_time` datetime NOT NULL,
			PRIMARY KEY  (ID),
			KEY `user_id` (`user_id`),
			KEY `client_id` (`client_id`)
		) $charset_collate;";
		dbDelta($sql);
	}
}

// register_activation_hook(__FILE__, 'schoolmoa_oauth_plugin_activation');
// function schoolmoa_oauth_plugin_activation()
// {
// 	global $wpdb;
// 	$charset_collate = $wpdb->get_charset_collate();
// 	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
// 	#코드와 토큰 테이블
// 	$sql = "CREATE TABLE {$wpdb->prefix}schoolmoa_oauth_token (
// 		`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
// 		`user_id` int(11) NOT NULL,
// 		`client_id` varchar(255) NOT NULL,
// 		`authorization_code` varchar(255) NULL,
// 		`authorization_code_expires` datetime NULL,
// 		`access_token` varchar(255) NULL,
// 		`access_token_expires` datetime NULL,
// 		PRIMARY KEY  (ID),
// 		KEY `user_id` (`user_id`),
// 		KEY `client_id` (`client_id`),
// 		KEY `authorization_code` (`authorization_code`),
// 		KEY `access_token` (`access_token`)
// 	) $charset_collate;";
// 	dbDelta($sql);

// 	#클라이언트 secret  테이블
// 	$sql = "CREATE TABLE {$wpdb->prefix}schoolmoa_oauth_client (
// 		`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
// 		`user_id` int(11) NOT NULL,
// 		`client_name` varchar(255) NOT NULL,
// 		`client_host` varchar(255) NOT NULL,
// 		`client_id` varchar(255) NOT NULL,
// 		`client_secret` varchar(255) NOT NULL,
// 		PRIMARY KEY  (ID),
// 		KEY `user_id` (`user_id`),
// 		KEY `client_id` (`client_id`),
// 		KEY `client_name` (`client_name`),
// 		KEY `client_host` (`client_host`)
// 	) $charset_collate;";
// 	dbDelta($sql);

// 	#로그인 정보 테이블
// 	$sql = "CREATE TABLE {$wpdb->prefix}schoolmoa_oauth_login (
// 		`ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
// 		`user_id` int(11) NOT NULL,
// 		`user_agree` varchar(255) NOT NULL,
// 		`client_id` varchar(255) NOT NULL,
// 		`login_time` datetime NOT NULL,
// 		PRIMARY KEY  (ID),
// 		KEY `user_id` (`user_id`),
// 		KEY `client_id` (`client_id`)
// 	) $charset_collate;";
// 	dbDelta($sql);
// }
