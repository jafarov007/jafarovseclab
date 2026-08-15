<?php
// Scenario 3: User Profile REST API Controller
// Language: PHP 8.2 / Native Framework

header('Content-Type: application/json');

$request_method = $_SERVER['REQUEST_METHOD'];
$path_info = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';
$uri_parts = explode('/', trim($path_info, '/'));
$path_id = isset($uri_parts[2]) ? $uri_parts[2] : null;

// Read JSON Body Payload
$raw_input = file_get_contents('php://input');
$body_data = json_decode($raw_input, true) ?? [];

// Check for _method Override parameter in body or query
if (isset($body_data['_method'])) {
    $request_method = strtoupper($body_data['_method']);
} elseif (isset($_GET['_method'])) {
    $request_method = strtoupper($_GET['_method']);
}

// Strict Authorization check only applied to standard GET requests
if ($request_method === 'GET') {
    http_response_code(403);
    echo json_encode(['error' => 'Direct GET inspection prohibited by security policy']);
    exit;
}

// Middleware checks authorization based on URL Path ID ($path_id)
$authenticated_user_id = $_SESSION['user_id'] ?? $path_id;

if ($path_id != $authenticated_user_id) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized path access']);
    exit;
}

// DATA LAYER FETCH: Data layer uses Body ID or Query ID if present!
// Vulnerability: Path ID passed auth check, but target record fetched via Body ID!
$target_id = $body_data['id'] ?? $_GET['id'] ?? $path_id;

$pdo = new PDO('sqlite:../data/idor.db');
$stmt = $pdo->prepare('SELECT user_id, email, full_name, phone, address FROM users WHERE user_id = :id');
$stmt->execute(['id' => $target_id]);
$user_profile = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user_profile) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

echo json_encode([
    'status' => 'success',
    'fetched_id' => $target_id,
    'data' => $user_profile
]);
?>
