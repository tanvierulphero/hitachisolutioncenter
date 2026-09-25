<?php
// ========================================================
// cPanel MySQL Database Configuration
// Fill in your cPanel MySQL Database details below
// ========================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'localmar_hitachi');
define('DB_USER', 'localmar_admin');
define('DB_PASS', 'localmar_admin');

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
            http_response_code(200);
            echo json_encode([
                "error" => "Database connection failed: " . $e->getMessage() . ". Please create database '" . DB_NAME . "' in cPanel -> MySQL Databases and import schema.sql.",
                "db_error" => true
            ]);
            exit;
        }
    }
    return $pdo;
}
