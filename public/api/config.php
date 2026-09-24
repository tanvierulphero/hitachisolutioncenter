<?php
// ========================================================
// cPanel MySQL Database Configuration
// Fill in your cPanel MySQL Database details below
// ========================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'your_cpanel_db_name');     // e.g. localmar_hitachi
define('DB_USER', 'your_cpanel_db_user');     // e.g. localmar_user
define('DB_PASS', 'your_cpanel_db_password'); // e.g. MySecretPassword123

function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
