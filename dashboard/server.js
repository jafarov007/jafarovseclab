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
    scenarios: 4,
    icon: '⚡',
    available: true
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
function checkHttpHealth(host = 'idor-s1', port = 8081) {
  return new Promise((resolve) => {
    const req = http.get({
      host: host,
      port: port,
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
  const { id } = req.params;
  if (id === 'idor') {
    const { stdout } = await runCmd('docker ps --filter "name=jafarovseclab-idor" --filter "status=running" --format "{{.Names}}"');
    if (stdout && stdout.includes('idor')) {
      return res.json({ status: 'running', initialized: true });
    }
    return res.json({ status: 'offline', initialized: false });
  } else if (id === 'xss') {
    const { stdout } = await runCmd('docker ps --filter "name=jafarovseclab-xss" --filter "status=running" --format "{{.Names}}"');
    if (stdout && stdout.includes('xss')) {
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
      console.log('[Dashboard] IDOR Scenario containers not found. Creating via docker run...');
      
      const commands = [
        'docker run -d --name jafarovseclab-idor-s1-1 --network jafarovseclab_labnet --network-alias idor-s1 jafarovseclab-idor-s1:latest',
        'docker run -d --name jafarovseclab-idor-s2-1 --network jafarovseclab_labnet --network-alias idor-s2 jafarovseclab-idor-s2:latest',
        'docker run -d --name jafarovseclab-idor-s3-1 --network jafarovseclab_labnet --network-alias idor-s3 jafarovseclab-idor-s3:latest',
        'docker run -d --name jafarovseclab-idor-s4-1 --network jafarovseclab_labnet --network-alias idor-s4 jafarovseclab-idor-s4:latest',
        'docker run -d --name jafarovseclab-idor-s5-1 --network jafarovseclab_labnet --network-alias idor-s5 jafarovseclab-idor-s5:latest',
        'docker run -d --name jafarovseclab-idor-s6-1 --network jafarovseclab_labnet --network-alias idor-s6 jafarovseclab-idor-s6:latest',
        'docker run -d --name jafarovseclab-idor-s7-1 --network jafarovseclab_labnet --network-alias idor-s7 jafarovseclab-idor-s7:latest',
        'docker run -d --name jafarovseclab-idor-s8-1 --network jafarovseclab_labnet --network-alias idor-s8 jafarovseclab-idor-s8:latest',
        'docker run -d --name jafarovseclab-idor-gateway-1 --network jafarovseclab_labnet --network-alias idor-gateway -p 8080-8088:8080-8088 jafarovseclab-idor-gateway:latest'
      ];

      for (const cmd of commands) {
        await runCmd(cmd);
      }
    }
    
    return res.json({ success: true, status: 'running', message: 'IDOR lab containers started successfully' });
  } else if (id === 'xss') {
    // 1. Try starting existing containers
    const { err, stderr } = await runCmd('docker start jafarovseclab-xss-s1-1 jafarovseclab-xss-s2-1 jafarovseclab-xss-s3-1 jafarovseclab-xss-s4-1 jafarovseclab-xss-gateway-1');

    if (err || (stderr && stderr.includes('No such container'))) {
      console.log('[Dashboard] XSS Scenario containers not found. Creating via docker run...');

      const commands = [
        'docker run -d --name jafarovseclab-xss-s1-1 --network jafarovseclab_labnet --network-alias xss-s1 jafarovseclab-xss-s1:latest',
        'docker run -d --name jafarovseclab-xss-s2-1 --network jafarovseclab_labnet --network-alias xss-s2 jafarovseclab-xss-s2:latest',
        'docker run -d --name jafarovseclab-xss-s3-1 --network jafarovseclab_labnet --network-alias xss-s3 jafarovseclab-xss-s3:latest',
        'docker run -d --name jafarovseclab-xss-s4-1 --network jafarovseclab_labnet --network-alias xss-s4 jafarovseclab-xss-s4:latest',
        'docker run -d --name jafarovseclab-xss-gateway-1 --network jafarovseclab_labnet --network-alias xss-gateway -p 9080-9084:9080-9084 jafarovseclab-xss-gateway:latest'
      ];

      for (const cmd of commands) {
        await runCmd(cmd);
      }
    }

    return res.json({ success: true, status: 'running', message: 'XSS lab containers started successfully' });
  }
  res.status(404).json({ error: 'Lab not found' });
});

// POST /api/labs/:id/stop
app.post('/api/labs/:id/stop', async (req, res) => {
  const { id } = req.params;
  if (id === 'idor') {
    await runCmd('docker stop jafarovseclab-idor-s1-1 jafarovseclab-idor-s2-1 jafarovseclab-idor-s3-1 jafarovseclab-idor-s4-1 jafarovseclab-idor-s5-1 jafarovseclab-idor-s6-1 jafarovseclab-idor-s7-1 jafarovseclab-idor-s8-1 jafarovseclab-idor-gateway-1');
    return res.json({ success: true, status: 'stopped', message: 'IDOR lab containers stopped' });
  } else if (id === 'xss') {
    await runCmd('docker stop jafarovseclab-xss-s1-1 jafarovseclab-xss-s2-1 jafarovseclab-xss-s3-1 jafarovseclab-xss-s4-1 jafarovseclab-xss-gateway-1');
    return res.json({ success: true, status: 'stopped', message: 'XSS lab containers stopped' });
  }
  res.status(404).json({ error: 'Lab not found' });
});

// POST /api/labs/:id/delete (Tear Down Lab)
app.post('/api/labs/:id/delete', async (req, res) => {
  const { id } = req.params;
  if (id === 'idor') {
    await runCmd('docker stop jafarovseclab-idor-s1-1 jafarovseclab-idor-s2-1 jafarovseclab-idor-s3-1 jafarovseclab-idor-s4-1 jafarovseclab-idor-s5-1 jafarovseclab-idor-s6-1 jafarovseclab-idor-s7-1 jafarovseclab-idor-s8-1 jafarovseclab-idor-gateway-1 && docker rm jafarovseclab-idor-s1-1 jafarovseclab-idor-s2-1 jafarovseclab-idor-s3-1 jafarovseclab-idor-s4-1 jafarovseclab-idor-s5-1 jafarovseclab-idor-s6-1 jafarovseclab-idor-s7-1 jafarovseclab-idor-s8-1 jafarovseclab-idor-gateway-1');
    return res.json({ success: true, status: 'deleted', message: 'IDOR lab containers completely removed' });
  } else if (id === 'xss') {
    await runCmd('docker stop jafarovseclab-xss-s1-1 jafarovseclab-xss-s2-1 jafarovseclab-xss-s3-1 jafarovseclab-xss-s4-1 jafarovseclab-xss-gateway-1 && docker rm jafarovseclab-xss-s1-1 jafarovseclab-xss-s2-1 jafarovseclab-xss-s3-1 jafarovseclab-xss-s4-1 jafarovseclab-xss-gateway-1');
    return res.json({ success: true, status: 'deleted', message: 'XSS lab containers completely removed' });
  }
  res.status(404).json({ error: 'Lab not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[JafarovSecLab] Dashboard running on http://0.0.0.0:${PORT}`);
});

