<?php
// ========================================================
// cPanel Image Upload Handler for Hitachi Solution Center
// Saves uploaded product images into the /uploads directory
// ========================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Ensure uploads folder exists in parent or current directory
$possibleUploadDirs = [
    __DIR__ . '/../uploads/',
    __DIR__ . '/uploads/',
    $_SERVER['DOCUMENT_ROOT'] . '/uploads/'
];

$uploadDir = null;
foreach ($possibleUploadDirs as $dir) {
    if (!file_exists($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (file_exists($dir) && is_writable($dir)) {
        $uploadDir = $dir;
        break;
    }
}

if (!$uploadDir) {
    $uploadDir = __DIR__ . '/../uploads/';
    @mkdir($uploadDir, 0755, true);
}

// Handle File Upload from FormData
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];
    $fileSize = $_FILES['file']['size'];
    $fileType = $_FILES['file']['type'];

    // Allowed file extensions
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    if (!in_array($fileExtension, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file extension. Allowed: JPG, PNG, WEBP, GIF, SVG']);
        exit;
    }

    // Limit size to 10MB
    if ($fileSize > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'File size exceeds 10MB limit']);
        exit;
    }

    // Generate unique name
    $newFileName = 'prod_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $fileExtension;
    $destPath = $uploadDir . $newFileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        @chmod($destPath, 0644);
        // Return relative path accessible via web browser
        $fileUrl = '/uploads/' . $newFileName;
        echo json_encode(['url' => $fileUrl, 'success' => true]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to move uploaded file to target folder. Please check /uploads directory permissions on cPanel.']);
        exit;
    }
}

// Handle JSON Base64 Payload as Fallback
$inputData = json_decode(file_get_contents('php://input'), true);
if (isset($inputData['base64'])) {
    $base64Data = $inputData['base64'];
    if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        $type = strtolower($type[1]); // jpg, png, etc.

        if (!in_array($type, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
            $type = 'png';
        }

        $base64Data = base64_decode($base64Data);
        if ($base64Data === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid base64 encoding']);
            exit;
        }

        $newFileName = 'prod_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $type;
        $destPath = $uploadDir . $newFileName;

        if (file_put_contents($destPath, $base64Data)) {
            $fileUrl = '/uploads/' . $newFileName;
            echo json_encode(['url' => $fileUrl, 'success' => true]);
            exit;
        }
    }
}

http_response_code(400);
echo json_encode(['error' => 'No image file provided in upload request']);
