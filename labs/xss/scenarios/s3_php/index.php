<?php
session_start();

// Initialize SQLite database
$dbFile = sys_get_temp_dir() . '/lab_xss_s3.sqlite';
$db = new PDO('sqlite:' . $dbFile);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        page_id INTEGER NOT NULL,
        referrer_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
");

// Seed users if empty
$stmt = $db->query("SELECT COUNT(*) FROM users");
if ($stmt->fetchColumn() == 0) {
    $db->prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)")
        ->execute(['user.a@example.com', 'password123', 'User', 'Alice Whitfield']);
    $db->prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)")
        ->execute(['admin@example.com', 'admin123', 'Admin', 'System Administrator']);
}

// Request path parsing
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#/+#', '/', $uri);

// Normalize path prefixes for proxy (/scenario/3, /s3)
$route = $uri;
if (strpos($route, '/scenario/3') === 0) {
    $route = substr($route, 11);
} elseif (strpos($route, '/s3') === 0) {
    $route = substr($route, 3);
}
if (empty($route)) $route = '/';

// API: Track page visit
if ($route === '/api/v1/track-page' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $userEmail = $_SESSION['user_email'] ?? 'guest@example.com';
    
    // Read X-Real-IP header or fallback to REMOTE_ADDR
    $ipAddress = $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    
    // Integer validation for page_id
    $pageId = filter_input(INPUT_POST, 'page', FILTER_VALIDATE_INT);
    if ($pageId === false || $pageId === null) {
        $pageId = 1;
    }
    
    // Read http_referrer_url parameter
    $referrerUrl = $_POST['http_referrer_url'] ?? '';

    // Insert log into database without HTML sanitization
    $stmt = $db->prepare("INSERT INTO activity_logs (user_email, ip_address, page_id, referrer_url) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userEmail, $ipAddress, (int)$pageId, $referrerUrl]);

    echo json_encode(['success' => true, 'message' => 'Activity logged successfully']);
    exit;
}

// API: Login
if ($route === '/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
    $stmt->execute([$email, $password]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_name'] = $user['name'];

        $basePath = (strpos($uri, '/scenario/3') === 0) ? '/scenario/3' : ((strpos($uri, '/s3') === 0) ? '/s3' : '');
        header("Location: " . $basePath . "/dashboard");
        exit;
    } else {
        $_SESSION['error'] = 'Invalid email or password.';
        $basePath = (strpos($uri, '/scenario/3') === 0) ? '/scenario/3' : ((strpos($uri, '/s3') === 0) ? '/s3' : '');
        header("Location: " . $basePath . "/");
        exit;
    }
}

// Logout
if ($route === '/logout') {
    session_destroy();
    $basePath = (strpos($uri, '/scenario/3') === 0) ? '/scenario/3' : ((strpos($uri, '/s3') === 0) ? '/s3' : '');
    header("Location: " . $basePath . "/");
    exit;
}

// Clear Logs (Admin helper)
if ($route === '/admin/clear-logs' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (($_SESSION['user_role'] ?? '') === 'Admin') {
        $db->exec("DELETE FROM activity_logs");
    }
    $basePath = (strpos($uri, '/scenario/3') === 0) ? '/scenario/3' : ((strpos($uri, '/s3') === 0) ? '/s3' : '');
    header("Location: " . $basePath . "/admin");
    exit;
}

// Source code review endpoint
if (strpos($route, '/code/file') === 0) {
    $name = $_GET['name'] ?? '';
    $allowedFiles = ['index.php', 'Dockerfile'];
    if (!in_array($name, $allowedFiles)) {
        http_response_code(403);
        echo 'Forbidden';
        exit;
    }
    $filePath = __DIR__ . '/' . $name;
    if (file_exists($filePath)) {
        header('Content-Type: text/plain');
        echo file_get_contents($filePath);
    } else {
        http_response_code(404);
        echo 'Not Found';
    }
    exit;
}

if ($route === '/code') {
    $basePath = (strpos($uri, '/scenario/3') === 0) ? '/scenario/3' : ((strpos($uri, '/s3') === 0) ? '/s3' : '');
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Scenario 3 Source Code Review | Stored Log XSS</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
      <style>
        :root { --bg-dark: #0d1117; --bg-side: #161b22; --border: #30363d; --text: #c9d1d9; --accent: #38bdf8; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg-dark); color: var(--text); margin: 0; padding: 0; display: flex; height: 100vh; overflow: hidden; }
        .sidebar { width: 280px; background: var(--bg-side); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .sidebar-header { padding: 20px; border-bottom: 1px solid var(--border); font-weight: 700; font-size: 0.95rem; color: #fff; }
        .file-list { padding: 10px; flex: 1; overflow-y: auto; }
        .file-item { padding: 10px 14px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; cursor: pointer; color: var(--text); margin-bottom: 4px; }
        .file-item.active { background: rgba(56, 189, 248, 0.15); color: var(--accent); font-weight: 600; }
        .main-editor { flex: 1; display: flex; flex-direction: column; background: var(--bg-dark); }
        #editor-header { padding: 14px 24px; background: var(--bg-side); border-bottom: 1px solid var(--border); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #8b949e; }
        pre { margin: 0; padding: 24px; flex: 1; overflow: auto; background: var(--bg-dark) !important; font-family: 'JetBrains Mono', monospace !important; font-size: 0.9rem !important; }
      </style>
    </head>
    <body>
      <div class="sidebar">
        <div class="sidebar-header">📂 PHP Source Code</div>
        <div class="file-list" id="file-list"></div>
      </div>
      <div class="main-editor">
        <div id="editor-header">Select a file to review</div>
        <pre id="code-frame"><code id="code-block" class="language-php"></code></pre>
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup-templating.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-php.min.js"></script>
      <script>
        const basePath = "<?= $basePath ?>";
        const files = ['index.php', 'Dockerfile'];
        const list = document.getElementById('file-list');
        files.forEach((f, idx) => {
          const item = document.createElement('div');
          item.className = 'file-item' + (idx === 0 ? ' active' : '');
          item.textContent = f;
          item.onclick = () => loadFile(f, item);
          list.appendChild(item);
        });
        async function loadFile(name, el) {
          document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
          el.classList.add('active');
          document.getElementById('editor-header').textContent = name;
          const res = await fetch(basePath + '/code/file?name=' + encodeURIComponent(name));
          const text = await res.text();
          const codeBlock = document.getElementById('code-block');
          codeBlock.textContent = text;
          Prism.highlightElement(codeBlock);
        }
        if(files.length > 0) loadFile(files[0], document.querySelector('.file-item'));
      </script>
    </body>
    </html>
    <?php
    exit;
}

// Calculate base path for HTML links and JS AJAX
$basePath = (strpos($uri, '/scenario/3') === 0) ? '/scenario/3' : ((strpos($uri, '/s3') === 0) ? '/s3' : '');

// Views rendering
if ($route === '/dashboard') {
    if (!isset($_SESSION['user_email'])) {
        header("Location: " . $basePath . "/");
        exit;
    }
    $userEmail = $_SESSION['user_email'];
    $userRole = $_SESSION['user_role'];
    $userName = $_SESSION['user_name'];
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portal Dashboard | Scenario 3</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        :root { --bg: #0a0a0c; --card: #121215; --border: #27272a; --text: #f4f4f5; --accent: #38bdf8; --muted: #a1a1aa; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
        header { background: var(--card); border-bottom: 1px solid var(--border); padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 10px; }
        .user-info { display: flex; align-items: center; gap: 16px; font-size: 0.9rem; }
        .btn-sm { padding: 6px 12px; background: #27272a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 0.85rem; }
        .btn-sm:hover { background: #3f3f46; }
        .btn-admin { background: #0284c7; color: #fff; }
        main { flex: 1; max-width: 900px; width: 100%; margin: 40px auto; padding: 0 20px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 32px; margin-bottom: 24px; }
        .nav-tabs { display: flex; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
        .tab-btn { padding: 10px 18px; background: #1a1a1e; border: 1px solid var(--border); color: var(--text); border-radius: 8px; cursor: pointer; font-weight: 600; }
        .tab-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
        .page-content { background: #18181b; border: 1px solid var(--border); border-radius: 8px; padding: 24px; font-size: 0.95rem; line-height: 1.6; }
        .tracker-status { margin-top: 16px; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; color: #34d399; }
      </style>
      <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    </head>
    <body>
      <header>
        <div class="brand">📌 Corporate Portal</div>
        <div class="user-info">
          <span><?= htmlspecialchars($userName) ?> (<strong><?= htmlspecialchars($userRole) ?></strong>)</span>
          <?php if ($userRole === 'Admin'): ?>
            <a href="<?= $basePath ?>/admin" class="btn-sm btn-admin">⚙️ Admin Logs</a>
          <?php endif; ?>
          <a href="<?= $basePath ?>/logout" class="btn-sm">Logout</a>
        </div>
      </header>
      <main>
        <div class="card">
          <h2 style="margin-bottom: 16px;">Internal Content Navigator</h2>
          <p style="color: var(--muted); margin-bottom: 24px;">Click through internal modules below. Each navigation triggers an automated HTTP audit log.</p>
          
          <div class="nav-tabs">
            <button class="tab-btn active" data-page="1">Module #1: Overview</button>
            <button class="tab-btn" data-page="2">Module #2: Security Rules</button>
            <button class="tab-btn" data-page="3">Module #3: Network Config</button>
            <button class="tab-btn" data-page="4">Module #4: Audit Reports</button>
          </div>

          <div class="page-content" id="content-area">
            <h3>Module #1: System Overview</h3>
            <p style="margin-top: 12px; color: var(--muted);">Welcome to the corporate portal. All access events are recorded into the security event stream for compliance monitoring.</p>
          </div>

          <div class="tracker-status" id="tracker-msg">✓ Auto-Tracker: Request sent to log stream</div>
        </div>
      </main>

      <script>
        const basePath = "<?= $basePath ?>";
        const modules = {
          1: { title: "Module #1: System Overview", body: "Welcome to the corporate portal. All access events are recorded into the security event stream for compliance monitoring." },
          2: { title: "Module #2: Security Rules", body: "Rule 101: Never trust unvalidated input. Rule 102: Ensure audit logs sanitize header data before rendering." },
          3: { title: "Module #3: Network Config", body: "Internal IP subnet: 10.0.4.0/24. Reverse proxy header forwarding: X-Real-IP enabled." },
          4: { title: "Module #4: Audit Reports", body: "Compliance check status: ACTIVE. Real-time visitor logs are dispatched to the Administrator Console." }
        };

        function trackPageVisit(pageId) {
          $.ajax({
            url: basePath + '/api/v1/track-page',
            method: 'POST',
            data: {
              page: pageId,
              http_referrer_url: window.location.pathname
            },
            success: function(res) {
              $('#tracker-msg').text('✓ Auto-Tracker: Page ' + pageId + ' visit logged successfully.').show();
            }
          });
        }

        $('.tab-btn').on('click', function() {
          $('.tab-btn').removeClass('active');
          $(this).addClass('active');
          const pageId = $(this).data('page');
          const m = modules[pageId];
          $('#content-area').html('<h3>' + m.title + '</h3><p style="margin-top:12px; color:#a1a1aa;">' + m.body + '</p>');
          trackPageVisit(pageId);
        });

        // Track initial page load
        trackPageVisit(1);
      </script>
    </body>
    </html>
    <?php
    exit;
}

// Admin Audit Log Page
if ($route === '/admin') {
    if (!isset($_SESSION['user_email']) || $_SESSION['user_role'] !== 'Admin') {
        header("Location: " . $basePath . "/");
        exit;
    }

    $logs = $db->query("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 50")->fetchAll(PDO::FETCH_ASSOC);
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Admin Audit Logs | Scenario 3</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        :root { --bg: #0a0a0c; --card: #121215; --border: #27272a; --text: #f4f4f5; --accent: #38bdf8; --muted: #a1a1aa; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 30px 20px; }
        .header { max-width: 1100px; margin: 0 auto 24px auto; display: flex; justify-content: space-between; align-items: center; }
        .card { max-width: 1100px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
        .btn-sm { padding: 8px 14px; background: #27272a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 0.85rem; border: none; cursor: pointer; }
        .btn-danger { background: #991b1b; color: #fca5a5; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 0.9rem; }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
        th { background: #1a1a1e; color: var(--muted); font-size: 0.8rem; text-transform: uppercase; font-weight: 600; }
        tr:hover { background: rgba(255,255,255,0.02); }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: #27272a; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h2>🛡️ Security Audit Logs (Administrator Panel)</h2>
          <p style="color: var(--muted); font-size: 0.85rem; margin-top: 4px;">System activity, header metadata, and visitor navigation records.</p>
        </div>
        <div>
          <a href="<?= $basePath ?>/dashboard" class="btn-sm">← Back to Portal</a>
          <form action="<?= $basePath ?>/admin/clear-logs" method="POST" style="display:inline-block; margin-left: 8px;">
            <button type="submit" class="btn-sm btn-danger">Clear All Logs</button>
          </form>
        </div>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User Email</th>
              <th>X-Real-IP Header</th>
              <th>Page ID</th>
              <th>Referrer URL</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <?php if (empty($logs)): ?>
              <tr>
                <td colspan="6" style="text-align:center; color: var(--muted); padding: 24px;">No activity logs recorded yet.</td>
              </tr>
            <?php else: ?>
              <?php foreach ($logs as $log): ?>
                <tr>
                  <td>#<?= (int)$log['id'] ?></td>
                  <td><span class="badge"><?= htmlspecialchars($log['user_email']) ?></span></td>
                  <!-- VULNERABILITY: Raw unescaped PHP output of X-Real-IP header -->
                  <td><?= $log['ip_address'] ?></td>
                  <td>Page #<?= (int)$log['page_id'] ?></td>
                  <!-- VULNERABILITY: Raw unescaped PHP output of http_referrer_url parameter -->
                  <td><?= $log['referrer_url'] ?></td>
                  <td style="color: var(--muted); font-size: 0.8rem;"><?= htmlspecialchars($log['created_at']) ?></td>
                </tr>
              <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </body>
    </html>
    <?php
    exit;
}

// Default: Login Page
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login | Corporate Portal (Scenario 3)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root { --bg: #0a0a0c; --card: #121215; --border: #27272a; --text: #f4f4f5; --accent: #38bdf8; --muted: #a1a1aa; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .login-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 420px; padding: 32px; }
    .brand { font-size: 1.2rem; font-weight: 700; margin-bottom: 24px; text-align: center; }
    .form-group { margin-bottom: 18px; }
    label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; }
    input { width: 100%; background: #1a1a1e; border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; color: var(--text); font-family: inherit; outline: none; }
    input:focus { border-color: var(--accent); }
    .btn { width: 100%; padding: 12px; background: var(--text); color: var(--bg); border: none; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 8px; }
    .btn:hover { background: #e4e4e7; }
    .error-box { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 10px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 16px; }
    .accounts-box { margin-top: 24px; padding: 16px; background: #18181b; border: 1px dashed var(--border); border-radius: 8px; font-size: 0.8rem; }
    .account-item { display: flex; justify-content: space-between; margin-top: 8px; font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="brand">📌 Corporate Portal</div>

    <?php if (isset($_SESSION['error'])): ?>
      <div class="error-box"><?= htmlspecialchars($_SESSION['error']); unset($_SESSION['error']); ?></div>
    <?php endif; ?>

    <form action="<?= $basePath ?>/login" method="POST">
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" name="email" value="user.a@example.com" required>
      </div>

      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" value="password123" required>
      </div>

      <button type="submit" class="btn">Sign In to Dashboard</button>
    </form>

    <div class="accounts-box">
      <div style="font-weight:700; color: var(--muted); margin-bottom: 8px;">🔑 Pre-Seeded Test Accounts</div>
      <div class="account-item">
        <span>Standard User:</span>
        <span style="color: var(--accent);">user.a@example.com / password123</span>
      </div>
      <div class="account-item">
        <span>Administrator:</span>
        <span style="color: #34d399;">admin@example.com / admin123</span>
      </div>
    </div>
  </div>
</body>
</html>
