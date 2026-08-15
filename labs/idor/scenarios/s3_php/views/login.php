<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UserSettings Portal | Cloud Sign In</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0c0914; color: #f1f5f9; margin: 0; padding: 0; display: flex; height: 100vh; align-items: center; justify-content: center; }
    .login-card { width: 380px; background: #161026; border: 1px solid #271a44; padding: 40px; border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); }
    .logo { font-size: 1.5rem; font-weight: 800; color: #a855f7; text-align: center; margin-bottom: 30px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 0.8rem; font-weight: 600; color: #c084fc; margin-bottom: 8px; text-transform: uppercase; }
    input { width: 100%; padding: 12px; background: #0c0914; border: 1px solid #3b2866; border-radius: 6px; color: #fff; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #a855f7; }
    .btn { width: 100%; background: #a855f7; color: #fff; font-weight: 700; border: none; padding: 14px; cursor: pointer; border-radius: 6px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn:hover { background: #9333ea; }
    .error { color: #f87171; font-size: 0.85rem; margin-top: 15px; text-align: center; }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="logo">⚙️ CLOUD SETTINGS</div>
    <form method="POST" action="">
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" name="email" required placeholder="user.b@example.com">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" required placeholder="••••••••">
      </div>
      <button class="btn" type="submit">Sign In</button>
      <?php if (!empty($error)): ?><div class="error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
    </form>
  </div>
</body>
</html>
