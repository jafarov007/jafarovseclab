const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Map virtual file trees for each scenario to display multi-language source code
const SCENARIO_FILE_MAPS = {
  '1': {
    name: 'Scenario 1 - Node.js',
    children: [
      { name: 'auth_service.js', realPath: path.join(__dirname, 'auth.js'), language: 'javascript' },
      { name: 'profile_handler.js', realPath: path.join(__dirname, 'profile.js'), language: 'javascript' },
    ]
  },
  '2': {
    name: 'Scenario 2 - Python',
    children: [
      { name: 'app.py', realPath: path.join(__dirname, '..', 'code_sources', 'python_scenario2.py'), language: 'python' },
      { name: 'access_control.py', realPath: path.join(__dirname, 'type_confusion.js'), language: 'python' }
    ]
  },
  '3': {
    name: 'Scenario 3 - PHP',
    children: [
      { name: 'user_api.php', realPath: path.join(__dirname, '..', 'code_sources', 'php_scenario3.php'), language: 'php' },
      { name: 'auth_middleware.php', realPath: path.join(__dirname, 'method_tampering.js'), language: 'php' }
    ]
  },
  '4': {
    name: 'Scenario 4 - Node.js',
    children: [
      { name: 'upload_controller.js', realPath: path.join(__dirname, 'file_upload.js'), language: 'javascript' }
    ]
  },
  '5': {
    name: 'Scenario 5 - Go',
    children: [
      { name: 'main.go', realPath: path.join(__dirname, '..', 'code_sources', 'go_scenario5.go'), language: 'go' }
    ]
  },
  '6': {
    name: 'Scenario 6 - Java',
    children: [
      { name: 'AdminController.java', realPath: path.join(__dirname, '..', 'code_sources', 'java_scenario6.java'), language: 'java' }
    ]
  },
  '7': {
    name: 'Scenario 7 - GraphQL',
    children: [
      { name: 'schema.graphql', realPath: path.join(__dirname, 'graphql.js'), language: 'graphql' }
    ]
  },
  '8': {
    name: 'Scenario 8 - Python',
    children: [
      { name: 'jwt_service.py', realPath: path.join(__dirname, '..', 'code_sources', 'python_scenario8.py'), language: 'python' }
    ]
  }
};

// Default fallback file map
const DEFAULT_MAP = SCENARIO_FILE_MAPS['1'];

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'code-viewer.html'));
});

// GET /code/api/files?scenario=X
router.get('/api/files', (req, res) => {
  const scenarioNum = req.query.scenario || '1';
  const scenarioMap = SCENARIO_FILE_MAPS[scenarioNum] || DEFAULT_MAP;

  res.json({
    name: scenarioMap.name,
    type: 'directory',
    children: scenarioMap.children.map(f => ({
      name: f.name,
      path: f.name,
      type: 'file',
      language: f.language
    }))
  });
});

// GET /code/api/file?path=X&scenario=Y
router.get('/api/file', (req, res) => {
  const { path: filePath, scenario: scenarioNum = '1' } = req.query;

  if (!filePath) return res.status(400).json({ error: 'path required' });

  const scenarioMap = SCENARIO_FILE_MAPS[scenarioNum] || DEFAULT_MAP;
  const fileObj = scenarioMap.children.find(f => f.name === filePath) || scenarioMap.children[0];

  if (!fileObj || !fileObj.realPath) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const content = fs.readFileSync(fileObj.realPath, 'utf-8');
    res.json({
      path: fileObj.name,
      language: fileObj.language || 'javascript',
      content: content,
      lines: content.split('\n').length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read file', details: err.message });
  }
});

module.exports = router;
