<?php
header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>🔧 cPanel Database & Server Diagnostic Tool</h2>";
echo "<hr>";

// 1. Check PHP Version
echo "<p><strong>1. PHP Version:</strong> " . phpversion() . " ✅</p>";

// 2. Check PDO MySQL Extension
if (extension_loaded('pdo_mysql')) {
    echo "<p><strong>2. PDO MySQL Extension:</strong> Enabled ✅</p>";
} else {
    echo "<p style='color:red;'><strong>2. PDO MySQL Extension:</strong> NOT INSTALLED / DISABLED ❌ (Please enable pdo_mysql in cPanel -> Select PHP Version -> Extensions)</p>";
}

// 3. Check config.php
$configPath = __DIR__ . '/config.php';
if (file_exists($configPath)) {
    echo "<p><strong>3. config.php File:</strong> Found at <code>" . htmlspecialchars($configPath) . "</code> ✅</p>";
    require_once $configPath;
} else {
    echo "<p style='color:red;'><strong>3. config.php File:</strong> NOT FOUND at <code>" . htmlspecialchars($configPath) . "</code> ❌</p>";
    exit;
}

// 4. Test Database Connection
echo "<h3>4. Testing MySQL Connection:</h3>";
echo "<ul>";
echo "<li>Host: <code>" . htmlspecialchars(DB_HOST) . "</code></li>";
echo "<li>Database: <code>" . htmlspecialchars(DB_NAME) . "</code></li>";
echo "<li>User: <code>" . htmlspecialchars(DB_USER) . "</code></li>";
echo "<li>Password: <code>" . (strlen(DB_PASS) > 0 ? "******** (" . strlen(DB_PASS) . " characters)" : "<span style='color:red;'>EMPTY!</span>") . "</code></li>";
echo "</ul>";

if (empty(DB_NAME) || empty(DB_USER)) {
    echo "<div style='padding:12px;background:#fff3cd;border:1px solid #ffeeba;color:#856404;border-radius:6px;'>";
    echo "⚠️ <strong>Notice:</strong> DB_NAME or DB_USER is empty in <code>api/config.php</code>. Please enter your cPanel database credentials.";
    echo "</div>";
    exit;
}

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    echo "<div style='padding:15px;background:#d4edda;border:1px solid #c3e6cb;color:#155724;border-radius:6px;font-size:16px;'>";
    echo "🎉 <strong>SUCCESS! Database connected successfully to '" . htmlspecialchars(DB_NAME) . "'!</strong>";
    echo "</div>";

    // Check Tables
    echo "<h3>5. Database Tables Check:</h3>";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($tables) > 0) {
        echo "<p style='color:green;'>Found " . count($tables) . " tables in database: <strong>" . implode(', ', $tables) . "</strong> ✅</p>";
    } else {
        echo "<div style='padding:12px;background:#fff3cd;border:1px solid #ffeeba;color:#856404;border-radius:6px;'>";
        echo "⚠️ <strong>No tables found in database!</strong><br>Please open cPanel -> <strong>phpMyAdmin</strong> -> click on <code>" . htmlspecialchars(DB_NAME) . "</code> -> click <strong>Import</strong> tab -> select <strong>schema.sql</strong> and click <strong>Go</strong>.";
        echo "</div>";
    }

} catch (PDOException $e) {
    echo "<div style='padding:15px;background:#f8d7da;border:1px solid #f5c6cb;color:#721c24;border-radius:6px;font-size:16px;'>";
    echo "❌ <strong>Connection Failed:</strong> " . htmlspecialchars($e->getMessage());
    echo "</div>";
    echo "<br><p><strong>Common Solutions:</strong></p>";
    echo "<ol>";
    echo "<li><strong>Access Denied:</strong> Check if Password in <code>api/config.php</code> matches the password in cPanel MySQL Databases.</li>";
    echo "<li><strong>Privileges:</strong> In cPanel -> MySQL Databases -> Add User to Database -> Select User & DB -> Click Add -> Check 'ALL PRIVILEGES' -> Click 'Make Changes'.</li>";
    echo "<li><strong>Database Not Found:</strong> Check if DB_NAME in <code>config.php</code> matches the exact database name in cPanel (including the cPanel username prefix like <code>localmar_</code>).</li>";
    echo "</ol>";
}
