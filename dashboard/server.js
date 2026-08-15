const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8777;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lab Inventory
const labs = [
  {
    id: 'idor',
    name_en: 'IDOR & Broken Access Control',
    name_tr: 'IDOR & Yetki Kontrol Hataları',
    category: 'Access Control',
    difficulty: 'Easy-Medium',
    scenarios: 8,
    icon: '🔑',
    available: true
  },
  {
    id: 'xss',
    name_en: 'Cross-Site Scripting (XSS)',
    name_tr: 'Siteler Arası Betik Çalıştırma (XSS)',
    category: 'Client Side',
    difficulty: 'Easy-Hard',
    scenarios: 6,
    icon: '⚡',
    available: false
  },
  {
    id: 'sqli',
    name_en: 'SQL Injection (SQLi)',
    name_tr: 'SQL Enjeksiyonu',
    category: 'Injection',
    difficulty: 'Easy-Hard',
    scenarios: 5,
    icon: '💉',
    available: false
  },
  {
    id: 'ssrf',
    name_en: 'Server-Side Request Forgery (SSRF)',
    name_tr: 'Sunucu Taraflı İstek Sahteciliği (SSRF)',
    category: 'Server Side',
    difficulty: 'Medium-Hard',
    scenarios: 4,
    icon: '🌐',
    available: false
  }
];

// Helper to run shell commands safely
function runCmd(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      resolve({ err, stdout: stdout ? stdout.trim() : '', stderr: stderr ? stderr.trim() : '' });
    });
  });
}

// Helper to check HTTP health of microservice container
function checkHttpHealth() {
  return new Promise((resolve) => {
    const req = http.get({
      host: 'idor-s1',
      port: 8081,
      path: '/',
      timeout: 3000
    }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', (err) => {
      resolve(false);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

app.get('/api/labs', (req, res) => {
  res.json({ labs });
});

// GET /api/labs/:id/status
app.get('/api/labs/:id/status', async (req, res) => {
  if (req.params.id === 'idor') {
    const isHealthy = await checkHttpHealth();
    if (isHealthy) {
      return res.json({ status: 'running', initialized: true });
    }
    const { stdout } = await runCmd('docker ps --filter "name=idor" --format "{{.Names}}"');
    if (stdout && stdout.includes('idor')) {
      return res.json({ status: 'running', initialized: true });
    }
    return res.json({ status: 'offline', initialized: false });
  }
  res.json({ status: 'offline', initialized: false });
});

// POST /api/labs/:id/start
app.post('/api/labs/:id/start', async (req, res) => {
  const { id } = req.params;
  if (id === 'idor') {
    // 1. Try starting the containers if they already exist
    const { err, stderr } = await runCmd('docker start jafarovseclab-idor-s1-1 jafarovseclab-idor-s2-1 jafarovseclab-idor-s3-1 jafarovseclab-idor-s4-1 jafarovseclab-idor-s5-1 jafarovseclab-idor-s6-1 jafarovseclab-idor-s7-1 jafarovseclab-idor-s8-1 jafarovseclab-idor-gateway-1');
    
    if (err || (stderr && stderr.includes('No such container'))) {
      // 2. If they do not exist, run docker run commands dynamically
      console.log('[Dashboard] Scenario containers not found. Creating via docker run...');
      
      const commands = [
        'docker run -d --name jafarovseclab-idor-s1-1 --network jafarovseclab_labnet --network-alias idor-s1 --restart unless-stopped jafarovseclab-idor-s1:latest',
        'docker run -d --name jafarovseclab-idor-s2-1 --network jafarovseclab_labnet --network-alias idor-s2 --restart unless-stopped jafarovseclab-idor-s2:latest',
        'docker run -d --name jafarovseclab-idor-s3-1 --network jafarovseclab_labnet --network-alias idor-s3 --restart unless-stopped jafarovseclab-idor-s3:latest',
        'docker run -d --name jafarovseclab-idor-s4-1 --network jafarovseclab_labnet --network-alias idor-s4 --restart unless-stopped jafarovseclab-idor-s4:latest',
        'docker run -d --name jafarovseclab-idor-s5-1 --network jafarovseclab_labnet --network-alias idor-s5 --restart unless-stopped jafarovseclab-idor-s5:latest',
        'docker run -d --name jafarovseclab-idor-s6-1 --network jafarovseclab_labnet --network-alias idor-s6 --restart unless-stopped jafarovseclab-idor-s6:latest',
        'docker run -d --name jafarovseclab-idor-s7-1 --network jafarovseclab_labnet --network-alias idor-s7 --restart unless-stopped jafarovseclab-idor-s7:latest',
        'docker run -d --name jafarovseclab-idor-s8-1 --network jafarovseclab_labnet --network-alias idor-s8 --restart unless-stopped jafarovseclab-idor-s8:latest',
        'docker run -d --name jafarovseclab-idor-gateway-1 --network jafarovseclab_labnet --network-alias idor-gateway -p 8080-8088:8080-8088 --restart unless-stopped jafarovseclab-idor-gateway:latest'
      ];

      for (const cmd of commands) {
        await runCmd(cmd);
      }
    }
    
    return res.json({ success: true, status: 'running', message: 'IDOR lab containers started successfully' });
  }
  res.status(404).json({ error: 'Lab not found' });
});

// POST /api/labs/:id/stop
app.post('/api/labs/:id/stop', async (req, res) => {
  const { id } = req.params;
  if (id === 'idor') {
    await runCmd('docker stop jafarovseclab-idor-s1-1 jafarovseclab-idor-s2-1 jafarovseclab-idor-s3-1 jafarovseclab-idor-s4-1 jafarovseclab-idor-s5-1 jafarovseclab-idor-s6-1 jafarovseclab-idor-s7-1 jafarovseclab-idor-s8-1 jafarovseclab-idor-gateway-1');
    return res.json({ success: true, status: 'stopped', message: 'IDOR lab containers stopped' });
  }
  res.status(404).json({ error: 'Lab not found' });
});

// POST /api/labs/:id/delete (Tear Down Lab)
app.post('/api/labs/:id/delete', async (req, res) => {
  const { id } = req.params;
  if (id === 'idor') {
    await runCmd('docker stop jafarovseclab-idor-s1-1 jafarovseclab-idor-s2-1 jafarovseclab-idor-s3-1 jafarovseclab-idor-s4-1 jafarovseclab-idor-s5-1 jafarovseclab-idor-s6-1 jafarovseclab-idor-s7-1 jafarovseclab-idor-s8-1 jafarovseclab-idor-gateway-1 && docker rm jafarovseclab-idor-s1-1 jafarovseclab-idor-s2-1 jafarovseclab-idor-s3-1 jafarovseclab-idor-s4-1 jafarovseclab-idor-s5-1 jafarovseclab-idor-s6-1 jafarovseclab-idor-s7-1 jafarovseclab-idor-s8-1 jafarovseclab-idor-gateway-1');
    return res.json({ success: true, status: 'deleted', message: 'IDOR lab containers completely removed' });
  }
  res.status(404).json({ error: 'Lab not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[JafarovSecLab] Dashboard running on http://0.0.0.0:${PORT}`);
});
