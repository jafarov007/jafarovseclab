import os
import re
from flask import Flask, request, session, redirect, jsonify, render_template, Response

app = Flask(__name__)
app.secret_key = 'xss-scenario-4-secret-key-2026'

# Pre-seeded data
user_data = {
    'email': 'user.a@example.com',
    'password': 'password123',
    'name': 'Alice Whitfield',
    'role': 'Security Engineer',
    'website': 'https://example.com'
}

comments = [
    {
        'author': 'Alice Whitfield',
        'content': 'Welcome to the DevHub community discussion board! Feel free to share your security insights.',
        'timestamp': '2026-08-18 10:00:00'
    }
]

def sanitize_comment(text):
    if not text:
        return ""
    # Single-pass non-recursive stripping of blacklisted tags and keywords
    blacklist = ['<script>', '</script>', 'alert', 'src', 'onerror']
    cleaned = text
    for word in blacklist:
        cleaned = re.sub(re.escape(word), '', cleaned, flags=re.IGNORECASE)
    return cleaned

def sanitize_url(url):
    if not url:
        return ""
    # Encodes double quotes and single quotes to prevent breaking out of href="..."
    cleaned = url.replace('"', '&quot;').replace("'", '&#39;')
    return cleaned

def get_base_path():
    path = request.path
    if path.startswith('/scenario/4'):
        return '/scenario/4'
    elif path.startswith('/s4'):
        return '/s4'
    return ''

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
@app.route('/<path:path>', methods=['GET', 'POST'])
def catch_all(path):
    base_path = get_base_path()
    rel_path = request.path
    if base_path and rel_path.startswith(base_path):
        rel_path = rel_path[len(base_path):]
    if not rel_path or rel_path == '':
        rel_path = '/'

    # Normalize trailing slash
    if rel_path.endswith('/code/file'):
        rel_path = '/code/file'
    elif rel_path.endswith('/code'):
        rel_path = '/code'
    elif rel_path.endswith('/login'):
        rel_path = '/login'
    elif rel_path.endswith('/logout'):
        rel_path = '/logout'
    elif rel_path.endswith('/dashboard'):
        rel_path = '/dashboard'

    # Route: Code file viewer
    if rel_path == '/code/file':
        filename = request.args.get('name', '')
        allowed_files = ['app.py', 'Dockerfile', 'requirements.txt']
        if filename not in allowed_files:
            return 'Forbidden', 403
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                return Response(f.read(), mimetype='text/plain')
        return 'Not Found', 404

    # Route: Code review interface
    if rel_path == '/code':
        return render_template('code.html', base_path=base_path)

    # Route: Login POST
    if rel_path == '/login' and request.method == 'POST':
        email = request.form.get('email', '')
        password = request.form.get('password', '')
        if email == user_data['email'] and password == user_data['password']:
            session['authenticated'] = True
            session['email'] = email
            return redirect('dashboard')
        else:
            session['error'] = 'Invalid email or password.'
            return redirect('./')

    # Route: Logout
    if rel_path == '/logout':
        session.clear()
        return redirect('./')

    # Route: Add Comment POST
    if rel_path.endswith('/api/v1/comments') and request.method == 'POST':
        if not session.get('authenticated'):
            return jsonify({'error': 'Unauthorized'}), 401
        content = request.form.get('content', '') or (request.json.get('content', '') if request.is_json else '')
        cleaned_content = sanitize_comment(content)
        comments.append({
            'author': user_data['name'],
            'content': cleaned_content,
            'timestamp': 'Just now'
        })
        return jsonify({'success': True, 'content': cleaned_content})

    # Route: Update Website POST
    if rel_path.endswith('/api/v1/profile/website') and request.method == 'POST':
        if not session.get('authenticated'):
            return jsonify({'error': 'Unauthorized'}), 401
        new_url = request.form.get('website', '') or (request.json.get('website', '') if request.is_json else '')
        cleaned_url = sanitize_url(new_url)
        user_data['website'] = cleaned_url
        return jsonify({'success': True, 'website': cleaned_url})

    # Route: Dashboard
    if rel_path == '/dashboard':
        if not session.get('authenticated'):
            return redirect('./')
        return render_template('dashboard.html', user=user_data, comments=comments, base_path=base_path)

    # Route: Login Page (Default)
    if session.get('authenticated'):
        return render_template('dashboard.html', user=user_data, comments=comments, base_path=base_path)
    error_msg = session.pop('error', None)
    return render_template('login.html', error_msg=error_msg, base_path=base_path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9084))
    app.run(host='0.0.0.0', port=port)
