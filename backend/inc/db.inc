<?php
	require_once("db_login.inc");
	function user_details($uid) {
		$response = mysql_query("SELECT * FROM users WHERE UID=" . $uid);
		return mysql_fetch_array($response);
	}
	function region_details($rid) {
		$response = mysql_query("SELECT * FROM regions WHERE RID=" . $rid);
		return mysql_fetch_array($response);
	}
?>