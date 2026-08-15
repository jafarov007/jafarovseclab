<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UserSettings Portal | Enterprise Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root { --bg-dark: #0c0914; --bg-card: #161026; --accent: #a855f7; --border: #271a44; --text: #f1f5f9; --text-muted: #c084fc; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg-dark); color: var(--text); margin: 0; padding: 0; min-height: 100vh; }
    .nav { height: 70px; background: #090610; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
    .logo { font-weight: 800; font-size: 1.25rem; color: var(--accent); display: flex; align-items: center; gap: 8px; }
    .nav-right { display: flex; align-items: center; gap: 20px; }
    .user-pill { background: rgba(168,85,247,0.1); border: 1px solid var(--border); color: var(--accent); padding: 8px 18px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
    .logout-btn { color: #f87171; text-decoration: none; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    .container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 40px; box-shadow: 0 15px 40px rgba(0,0,0,0.4); margin-bottom: 24px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .card-title { font-size: 1.3rem; font-weight: 700; color: #fff; margin: 0; }
    .btn { background: var(--accent); color: #fff; font-weight: 700; border: none; padding: 12px 28px; border-radius: 6px; cursor: pointer; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn:hover { background: #9333ea; }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .info-box { background: #0c0914; border: 1px solid var(--border); padding: 18px; border-radius: 6px; }
    .info-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-family: 'JetBrains Mono'; margin-bottom: 6px; }
    .info-val { font-size: 1.1rem; font-weight: 700; color: #fff; }
    .footer-link { text-align: right; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px; }
    .footer-link a { color: #e9d5ff; font-family: 'JetBrains Mono'; text-decoration: none; font-size: 0.85rem; }
    .alert-box { padding: 14px; border-radius: 6px; margin-bottom: 20px; font-family: 'JetBrains Mono'; font-size: 0.85rem; background: rgba(168,85,247,0.15); border: 1px solid var(--accent); color: #f3e8ff; }
  </style>
</head>
<body>
  <div class="nav">
    <div class="logo">⚙️ CLOUD SETTINGS MANAGER</div>
    <div class="nav-right">
      <div class="user-pill">👤 User: <?= htmlspecialchars($currName) ?></div>
      <a href="logout" class="logout-btn">Log Out</a>
    </div>
  </div>
  <div class="container">
    <?php if (!empty($statusMsg)): ?><div class="alert-box"><?= $statusMsg ?></div><?php endif; ?>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">User Account & Profile Settings</h3>
      </div>
      <p style="color:#94a3b8; font-size:0.9rem;">Update personal details across internal cloud directory nodes.</p>
      
      <div class="profile-grid">
        <div class="info-box">
          <div class="info-label">Full Name</div>
          <div class="info-val"><?= htmlspecialchars($currUser['full_name']) ?></div>
        </div>
        <div class="info-box">
          <div class="info-label">Email Address</div>
          <div class="info-val"><?= htmlspecialchars($currUser['email']) ?></div>
        </div>
        <div class="info-box">
          <div class="info-label">Phone Number</div>
          <div class="info-val"><?= htmlspecialchars($currUser['phone']) ?></div>
        </div>
        <div class="info-box">
          <div class="info-label">SSN / Secret PII</div>
          <div class="info-val" style="color:var(--accent);"><?= htmlspecialchars($currUser['ssn']) ?></div>
        </div>
      </div>

      <h4 style="margin-top:32px; color:#fff; font-size:1.1rem;">Update Contact Preferences</h4>
      <form method="POST" action="">
        <input type="hidden" name="_method" value="PATCH">
        <input type="hidden" name="id" value="<?= $currId ?>">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
          <div>
            <label style="display:block; font-size:0.8rem; color:var(--text-muted); margin-bottom:6px;">Update Phone</label>
            <input type="text" name="phone" value="<?= htmlspecialchars($currUser['phone']) ?>" style="width:100%; padding:10px; background:#0c0914; border:1px solid #3b2866; border-radius:4px; color:#fff;">
          </div>
          <div>
            <label style="display:block; font-size:0.8rem; color:var(--text-muted); margin-bottom:6px;">Update Bio</label>
            <input type="text" name="bio" value="Active User" style="width:100%; padding:10px; background:#0c0914; border:1px solid #3b2866; border-radius:4px; color:#fff;">
          </div>
        </div>
        <button type="submit" class="btn">Update Settings</button>
      </form>

      <div class="footer-link">
        <a href="code" target="_blank">🔍 PHP Source Code Review (/code)</a>
      </div>
    </div>
  </div>
</body>
</html>
