<?php
session_start();

// Mock User Database
$users = [
    99504 => [
        'user_id' => 99504,
        'username' => 'alice_whitfield',
        'email' => 'user.a@example.com',
        'password' => 'password123',
        'full_name' => 'Alice Whitfield',
        'phone' => '+1-555-0199',
        'ssn' => '999-00-1234',
        'role' => 'Executive Administrator'
    ],
    22652 => [
        'user_id' => 22652,
        'username' => 'bob_martinez',
        'email' => 'user.b@example.com',
        'password' => 'password123',
        'full_name' => 'Bob Martinez',
        'phone' => '+1-555-0122',
        'ssn' => '111-00-5678',
        'role' => 'Security Consultant'
    ]
];

$uri = $_SERVER['REQUEST_URI'];
if (strpos($uri, '?') !== false) {
    $uri = substr($uri, 0, strpos($uri, '?'));
}

// Code Review Routes
if (strpos($uri, '/code/file') !== false) {
    $name = $_GET['name'] ?? '';
    $allowedFiles = ['index.php', 'views/dashboard.php', 'views/login.php', 'Dockerfile'];
    if (!in_array($name, $allowedFiles, true)) {
        http_response_code(403);
        echo "Forbidden";
        exit();
    }
    $filePath = __DIR__ . '/' . $name;
    if (file_exists($filePath)) {
        header('Content-Type: text/plain');
        echo file_get_content_or_fail($filePath);
    } else {
        http_response_code(404);
        echo "Not Found";
    }
    exit();
}

function file_get_content_or_fail($path) {
    return file_get_contents($path);
}

if ($uri === '/code' || strpos($uri, '/code') !== false) {
    include __DIR__ . '/views/code.php';
    exit();
}

// Handle Logout Path
if (strpos($uri, '/logout') !== false) {
    session_destroy();
    $ref = $_SERVER['HTTP_REFERER'] ?? './';
    header('Location: ' . $ref);
    exit();
}

// Redirect/Login Check for web pages (excluding API and code review routes)
$isApiRoute = (strpos($uri, '/api/') === 0);

if (!isset($_SESSION['email']) && !$isApiRoute) {
    $error = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $foundUser = null;
        foreach ($users as $u) {
            if (($u['email'] === $email || $u['username'] === $email) && $u['password'] === $password) {
                $foundUser = $u;
                break;
            }
        }
        if ($foundUser) {
            $_SESSION['email'] = $foundUser['email'];
            $_SESSION['user_id'] = $foundUser['user_id'];
            $ref = $_SERVER['HTTP_REFERER'] ?? './';
            header('Location: ' . $ref);
            exit();
        } else {
            $error = 'Invalid email or password';
        }
    }
    
    include __DIR__ . '/views/login.php';
    exit();
}

// Fetch Profile or Update Settings Action Handler
$statusMsg = '';
$currId = $_SESSION['user_id'];
$currName = ($currId === 22652) ? 'Bob Martinez' : 'Alice Whitfield';
$currUser = $users[$currId];

// API Routes: GET /api/v3/user/:id or PUT /api/v3/user/:id
if (preg_match('#^/api/v3/user/(\d+)$#', $uri, $matches)) {
    $pathId = (int)$matches[1];
    $method = $_SERVER['REQUEST_METHOD'];

    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true) ?: [];
    
    if (empty($body) && $method === 'POST') {
        $body = $_POST;
    }

    // Method Override Bug
    $effectiveMethod = isset($body['_method']) ? strtoupper($body['_method']) : $method;

    if ($effectiveMethod === 'GET') {
        $headerUserId = isset($_SERVER['HTTP_X_USER_ID']) ? (int)$_SERVER['HTTP_X_USER_ID'] : 0;
        if ($pathId !== $headerUserId) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Forbidden']);
            exit();
        }
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'data' => $users[$pathId] ?? null]);
        exit();
    }

    // Path vs Body ID Mismatch Bug
    $targetId = isset($body['id']) ? (int)$body['id'] : $pathId;
    if (isset($users[$targetId])) {
        if (isset($body['full_name'])) $users[$targetId]['full_name'] = $body['full_name'];
        if (isset($body['email'])) $users[$targetId]['email'] = $body['email'];
        if (isset($body['phone'])) $users[$targetId]['phone'] = $body['phone'];

        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success',
            'updated_id' => $targetId,
            'user' => $users[$targetId]
        ]);
        exit();
    } else {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'User not found']);
        exit();
    }
}

// Handle Form Submission for Settings Update
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true) ?: [];
    if (empty($body)) {
        $body = $_POST;
    }
    
    $effectiveMethod = isset($body['_method']) ? strtoupper($body['_method']) : $_SERVER['REQUEST_METHOD'];
    $targetId = isset($body['id']) ? (int)$body['id'] : $currId;
    
    if (isset($users[$targetId])) {
        if (isset($body['phone'])) $users[$targetId]['phone'] = $body['phone'];
        $statusMsg = "Settings updated successfully for User ID {$targetId} (" . htmlspecialchars($users[$targetId]['full_name']) . ") via HTTP {$effectiveMethod} override.";
        $currUser = $users[$currId];
    }
}

include __DIR__ . '/views/dashboard.php';
