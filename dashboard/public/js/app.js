// JafarovSecLab - Dashboard Controller v2
// Orchestrates lab lifecycle, state persistence on refresh, deletion, and subdomain UI routing

(function () {
  'use strict';

  const state = {
    labs: [],
    activeLab: localStorage.getItem('jafarov_active_lab') || null,
    labStarted: {},
    labData: {},
  };

  const mainContent = document.getElementById('main-content');
  const labList = document.getElementById('lab-list');
  const searchInput = document.getElementById('lab-search');
  const langToggleBtn = document.getElementById('lang-toggle');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const statusIndicator = document.getElementById('lab-status-indicator');

  async function init() {
    await loadLabs();
    if (state.activeLab) {
      await checkActiveLabStatus(state.activeLab);
    }
    renderSidebar();

    if (state.activeLab) {
      renderLabDetail(state.activeLab);
    } else {
      renderWelcome();
    }

    bindEvents();
    updateLanguageUI();
  }

  async function loadLabs() {
    try {
      const res = await fetch('/api/labs');
      const data = await res.json();
      state.labs = data.labs;
    } catch (err) {
      console.error('Failed to load labs:', err);
      state.labs = [];
    }
  }

  let selectSeq = 0;

  // State Persistence Check on Browser Load / Refresh
  async function checkActiveLabStatus(labId) {
    const target = labId || state.activeLab || 'idor';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`/api/labs/${target}/status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data && (data.status === 'running' || data.initialized)) {
        state.labStarted[target] = true;
        state.labData[target] = data;
        if (target === state.activeLab) setStatus('running');
      } else {
        state.labStarted[target] = false;
        state.labData[target] = null;
        if (target === state.activeLab) setStatus('idle');
      }
    } catch (err) {
      state.labStarted[target] = false;
      if (target === state.activeLab) setStatus('idle');
    }
  }

  function bindEvents() {
    if (searchInput) searchInput.addEventListener('input', renderSidebar);
    if (langToggleBtn) {
      langToggleBtn.addEventListener('click', () => {
        toggleLanguage();
        renderSidebar();
        renderCurrentView();
      });
    }
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
  }

  function renderSidebar() {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const filtered = state.labs.filter(lab => {
      const name = currentLang === 'tr' ? lab.name_tr : lab.name_en;
      return name.toLowerCase().includes(query);
    });

    labList.innerHTML = filtered.map(lab => {
      const name = currentLang === 'tr' ? lab.name_tr : lab.name_en;
      const isActive = state.activeLab === lab.id;
      const isDisabled = !lab.available;
      const badgeClass = lab.available ? 'badge-ready' : 'badge-soon';
      const badgeText = lab.available ? t('badge_ready') : t('badge_soon');

      return `
        <div class="lab-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}"
             data-lab-id="${lab.id}" ${isDisabled ? '' : `onclick="selectLab('${lab.id}')"`}>
          <span class="lab-item-icon">${lab.icon}</span>
          <div class="lab-item-info">
            <div class="lab-item-name">${name}</div>
            <div class="lab-item-meta">${lab.scenarios} ${t('scenarios_count')}</div>
          </div>
          <span class="lab-item-badge ${badgeClass}">${badgeText}</span>
        </div>
      `;
    }).join('');
  }

  function renderWelcome() {
    state.activeLab = null;
    localStorage.removeItem('jafarov_active_lab');
    renderSidebar();
    mainContent.innerHTML = `
      <div class="welcome-container">
        <div class="welcome-hero">
          <h1 class="welcome-title">${t('welcome_title')}</h1>
          <p class="welcome-subtitle">${t('welcome_subtitle')}</p>
        </div>
        <div class="readme-card">
          <div class="readme-header">
            <span class="readme-header-icon">📄</span>
            <span class="readme-header-title">${t('readme_title')}</span>
          </div>
          <div class="readme-content">
            <h3>🚀 ${t('readme_getting_started')}</h3>
            <ul>
              <li>${t('readme_step_1')}</li>
              <li>${t('readme_step_2')}</li>
              <li>${t('readme_step_3')}</li>
              <li>${t('readme_step_4')}</li>
              <li>${t('readme_step_5')}</li>
            </ul>
            <h3>⚙️ ${t('readme_how_it_works')}</h3>
            <p>${t('readme_how_desc')}</p>
            <h3>🔍 ${t('readme_code_review')}</h3>
            <p>${t('readme_code_desc')}</p>
            <h3>⚠️ ${t('readme_important')}</h3>
            <p>${t('readme_important_desc')}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderLabDetail(labId) {
    const lab = state.labs.find(l => l.id === labId);
    if (!lab) return;

    const name = currentLang === 'tr' ? lab.name_tr : lab.name_en;
    const isStarted = !!state.labStarted[labId];
    const descKey = labId === 'idor' ? 'lab_description_idor' : labId === 'xss' ? 'lab_description_xss' : '';

    let html = `
      <div class="lab-detail">
        <div class="lab-header">
          <div class="lab-header-info">
            <h1 class="lab-title">${lab.icon} ${name}</h1>
            <p class="lab-description">${t(descKey)}</p>
          </div>
          <div class="lab-actions-group">
    `;

    if (!isStarted) {
      html += `
        <button class="btn btn-primary" id="btn-start-lab" onclick="startLab('${labId}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          ${t('btn_start')}
        </button>
      `;
    } else {
      html += `
        <button class="btn btn-warning" id="btn-stop-lab" onclick="stopLab('${labId}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
          ${t('btn_stop')}
        </button>
        <button class="btn btn-danger" id="btn-delete-lab" onclick="deleteLab('${labId}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          ${t('btn_delete')}
        </button>
      `;
    }

    html += `</div></div>`;
    html += `<div id="setup-terminal-area"></div>`;

    if (isStarted) {
      html += renderScenarios(labId);
    }

    html += `</div>`;
    mainContent.innerHTML = html;
  }

  async function startLab(labId) {
    const btn = document.getElementById('btn-start-lab');
    if (btn) {
      btn.classList.add('btn-disabled');
      btn.innerHTML = `${t('btn_starting')}`;
    }

    setStatus('loading');

    const termArea = document.getElementById('setup-terminal-area');
    termArea.innerHTML = `
      <div class="setup-terminal">
        <div class="terminal-header">
          <span class="terminal-dot red"></span>
          <span class="terminal-dot yellow"></span>
          <span class="terminal-dot green"></span>
          <span class="terminal-title">${t('terminal_title')}</span>
        </div>
        <div class="terminal-body" id="terminal-output"></div>
      </div>
    `;

    const output = document.getElementById('terminal-output');
    const steps = [
      { text: t('setup_step_1'), delay: 400 },
      { text: t('setup_step_2'), delay: 500 },
      { text: t('setup_step_3'), delay: 400 },
      { text: t('setup_step_4'), delay: 300 },
      { text: t('setup_step_5'), delay: 300 },
      { text: t('setup_step_6'), delay: 300 },
    ];

    for (let i = 0; i < steps.length; i++) {
      await delay(steps[i].delay);
      output.innerHTML += `<div class="terminal-line"><span class="prompt">$</span><span class="cmd">${steps[i].text}</span></div>`;
      output.innerHTML += `<div class="terminal-line"><span class="info">  ✓ ${steps[i].text} OK</span></div>`;
      output.scrollTop = output.scrollHeight;
    }

    try {
      const res = await fetch(`/api/labs/${labId}/start`, { method: 'POST' });
      const data = await res.json();
      state.labData[labId] = data;
      state.labStarted[labId] = true;

      output.innerHTML += `<div class="terminal-line"><span class="success">✅ ${t('setup_complete')}</span></div>`;

      output.scrollTop = output.scrollHeight;
      setStatus('running');

      await delay(500);
      renderLabDetail(labId);
    } catch (err) {
      output.innerHTML += `<div class="terminal-line"><span class="error">❌ Error: ${err.message}</span></div>`;
      setStatus('idle');
    }
  }

  async function stopLab(labId) {
    try {
      await fetch(`/api/labs/${labId}/stop`, { method: 'POST' });
    } catch (err) {
      console.error('Stop error:', err);
    }
    state.labStarted[labId] = false;
    state.labData[labId] = null;
    setStatus('idle');
    renderLabDetail(labId);
  }

  // Delete / Tear Down Lab Orchestrator
  async function deleteLab(labId) {
    if (!confirm('Are you sure you want to completely tear down and remove this lab container and database state?')) {
      return;
    }

    const btn = document.getElementById('btn-delete-lab');
    if (btn) {
      btn.classList.add('btn-disabled');
      btn.innerHTML = `${t('btn_deleting')}`;
    }

    try {
      await fetch(`/api/labs/${labId}/delete`, { method: 'POST' });
    } catch (err) {
      console.error('Delete error:', err);
    }

    state.labStarted[labId] = false;
    state.labData[labId] = null;
    setStatus('idle');
    renderLabDetail(labId);
  }

  function renderScenarios(labId) {
    let scenarios = [];
    if (labId === 'idor') {
      scenarios = [
        { num: 1, key: 's1', lang: 'Node.js', langClass: 'node', subdomain: 's1.idor.lab.local', port: 8081, gatewayPort: 8080, labDomain: 'idor.lab.local' },
        { num: 2, key: 's2', lang: 'Python', langClass: 'python', subdomain: 's2.idor.lab.local', port: 8082, gatewayPort: 8080, labDomain: 'idor.lab.local' },
        { num: 3, key: 's3', lang: 'PHP', langClass: 'php', subdomain: 's3.idor.lab.local', port: 8083, gatewayPort: 8080, labDomain: 'idor.lab.local' },
        { num: 4, key: 's4', lang: 'Node.js', langClass: 'node', subdomain: 's4.idor.lab.local', port: 8084, gatewayPort: 8080, labDomain: 'idor.lab.local' },
        { num: 5, key: 's5', lang: 'Go', langClass: 'go', subdomain: 's5.idor.lab.local', port: 8085, gatewayPort: 8080, labDomain: 'idor.lab.local' },
        { num: 6, key: 's6', lang: 'Java', langClass: 'java', subdomain: 's6.idor.lab.local', port: 8086, gatewayPort: 8080, labDomain: 'idor.lab.local' },
        { num: 7, key: 's7', lang: 'GraphQL', langClass: 'graphql', subdomain: 's7.idor.lab.local', port: 8087, gatewayPort: 8080, labDomain: 'idor.lab.local' },
        { num: 8, key: 's8', lang: 'Python', langClass: 'python', subdomain: 's8.idor.lab.local', port: 8088, gatewayPort: 8080, labDomain: 'idor.lab.local' },
      ];
    } else if (labId === 'xss') {
      scenarios = [
        { num: 1, key: 'xss_s1', lang: 'Vue.js', langClass: 'node', subdomain: 's1.xss.lab.local', port: 9081, gatewayPort: 9080, labDomain: 'xss.lab.local' },
        { num: 2, key: 'xss_s2', lang: 'jQuery', langClass: 'node', subdomain: 's2.xss.lab.local', port: 9082, gatewayPort: 9080, labDomain: 'xss.lab.local' },
        { num: 3, key: 'xss_s3', lang: 'PHP', langClass: 'php', subdomain: 's3.xss.lab.local', port: 9083, gatewayPort: 9080, labDomain: 'xss.lab.local' },
        { num: 4, key: 'xss_s4', lang: 'Python', langClass: 'python', subdomain: 's4.xss.lab.local', port: 9084, gatewayPort: 9080, labDomain: 'xss.lab.local' },
      ];
    }

    let html = `
      <div class="scenarios-section">
        <div class="scenarios-title">
          📋 ${t('scenarios_title')}
          <span class="scenarios-count">${scenarios.length} Scenario${scenarios.length > 1 ? 's' : ''}</span>
        </div>
    `;

    scenarios.forEach(sc => {
      html += `
        <div class="scenario-card" id="scenario-${sc.num}">
          <div class="scenario-header" onclick="toggleScenario(${sc.num})">
            <span class="scenario-number">${sc.num}</span>
            <span class="scenario-title-text">${t(sc.key + '_title')}</span>
            <span class="lang-badge ${sc.langClass}">${sc.lang}</span>
            <span class="scenario-status-badge badge-active">${t('scenario_active')}</span>
            <svg class="scenario-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="scenario-body">
            <div class="scenario-content">
              ${renderScenarioDetails(sc, labId)}
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  function renderScenarioDetails(sc, labId) {
    const gatewayPort = sc.gatewayPort || 8080;
    const labDomain = sc.labDomain || 'idor.lab.local';

    const subdomainUrl = `http://${sc.subdomain}:${gatewayPort}`;
    const directPortUrl = `http://localhost:${sc.port}`;
    const fallbackPathUrl = `http://localhost:${gatewayPort}/scenario/${sc.num}`;
    const codeUrl = `http://localhost:${gatewayPort}/scenario/${sc.num}/code`;

    let html = `
      <div class="scenario-section">
        <div class="scenario-section-title">Vulnerability Mechanism</div>
        <p class="scenario-text">${t(sc.key + '_desc')}</p>
      </div>
      <div class="scenario-section">
        <div class="scenario-section-title">Challenge Objective</div>
        <p class="scenario-text">${t(sc.key + '_obj')}</p>
      </div>
      <div class="scenario-section">
        <div class="scenario-section-title">${t('label_subdomain')}</div>
        <div class="info-box">
          <div class="label">Subdomain Access (Recommended)</div>
          <div class="value"><a href="${subdomainUrl}" target="_blank" style="color:#38bdf8; text-decoration:underline; font-weight:600;">${subdomainUrl}</a></div>
        </div>
        <div class="info-box">
          <div class="label">Direct Port Access</div>
          <div class="value"><a href="${directPortUrl}" target="_blank" style="color:#38bdf8; text-decoration:underline; font-weight:600;">${directPortUrl}</a></div>
        </div>
        <div class="info-box">
          <div class="label">Path Alias Access</div>
          <div class="value"><a href="${fallbackPathUrl}" target="_blank" style="color:#38bdf8; text-decoration:underline; font-weight:600;">${fallbackPathUrl}</a></div>
        </div>
      </div>
      <div class="scenario-section">
        <div class="scenario-section-title">${t('label_hosts_entry')}</div>
        <div class="info-box">
          <div class="value orange">127.0.0.1    ${sc.subdomain} ${labDomain}</div>
        </div>
      </div>
    `;

    if (labId === 'idor') {
      const userA = { email: 'user.a@example.com', user_id: '995043202' };
      const userB = { email: 'user.b@example.com', user_id: '552450897' };
      html += `
        <div class="scenario-section">
          <div class="scenario-section-title">${t('label_credentials')}</div>
          <div class="credential-grid">
            <div class="info-box">
              <div class="label">${t('label_user_a')} [ID: ${userA.user_id}]</div>
              <div class="value">${t('label_email')}: ${userA.email}</div>
              <div class="value">${t('label_password')}: password123</div>
            </div>
            <div class="info-box">
              <div class="label">${t('label_user_b')} [ID: ${userB.user_id}]</div>
              <div class="value">${t('label_email')}: ${userB.email}</div>
              <div class="value">${t('label_password')}: password123</div>
            </div>
          </div>
        </div>
      `;
    } else {
      const userA = { email: 'user.a@example.com' };
      html += `
        <div class="scenario-section">
          <div class="scenario-section-title">${t('label_credentials')}</div>
          <div class="credential-grid">
            <div class="info-box">
              <div class="label">Test Account</div>
              <div class="value">${t('label_email')}: ${userA.email}</div>
              <div class="value">${t('label_password')}: password123</div>
            </div>
          </div>
        </div>
      `;
    }

    html += `
      <div class="scenario-links-row">
        <a href="${fallbackPathUrl}" target="_blank" class="subdomain-app-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          ${t('label_launch_app')} (Scenario ${sc.num})
        </a>
        <a href="${codeUrl}" target="_blank" class="code-review-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          ${t('label_code_review')} (${sc.lang})
        </a>
      </div>
    `;

    return html;
  }

  function setStatus(status) {
    if (!statusIndicator) return;
    const dot = statusIndicator.querySelector('.status-dot');
    const text = statusIndicator.querySelector('.status-text');
    dot.className = 'status-dot';

    if (status === 'running') {
      dot.classList.add('running');
      text.textContent = t('status_running');
    } else if (status === 'loading') {
      dot.classList.add('loading');
      text.textContent = t('status_loading');
    } else {
      dot.classList.add('offline');
      text.textContent = t('status_idle');
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  window.selectLab = function (labId) {
    const mySeq = ++selectSeq;
    state.activeLab = labId;
    localStorage.setItem('jafarov_active_lab', labId);

    // 1. Render UI INSTANTLY (0ms response time!)
    renderSidebar();
    renderLabDetail(labId);

    // 2. Fetch status in background and update badge cleanly without full re-render loop
    checkActiveLabStatus(labId).then(() => {
      if (mySeq === selectSeq && state.activeLab === labId) {
        renderSidebar();
        setStatus(state.labStarted[labId] ? 'running' : 'idle');
      }
    });
  };

  window.toggleScenario = function (num) {
    const card = document.getElementById(`scenario-${num}`);
    if (card) card.classList.toggle('open');
  };

  window.renderWelcome = function() {
    renderWelcome();
  };

  window.startLab = startLab;
  window.stopLab = stopLab;
  window.deleteLab = deleteLab;

  window.renderCurrentView = function () {
    renderSidebar();
    if (state.activeLab) {
      renderLabDetail(state.activeLab);
    } else {
      renderWelcome();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
