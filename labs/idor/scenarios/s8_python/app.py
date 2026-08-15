import sqlite3
import os
import base64
import json
import hmac
import hashlib
from flask import Flask, request, jsonify, render_template, redirect, session, make_response

app = Flask(__name__)
app.secret_key = 'super_secret_jwt_key'
app.config['SESSION_COOKIE_NAME'] = 's8_session'

JWT_SECRET = 's3cr3t_j4f4r0v_l4b_k3y_2024'

def base64url_encode(input_bytes):
    return base64.urlsafe_b64encode(input_bytes).rstrip(b'=').decode('utf-8')

def base64url_decode(input_str):
    rem = len(input_str) % 4
    if rem > 0:
        input_str += '=' * (4 - rem)
    return base64.urlsafe_b64decode(input_str)

def create_jwt(user_id, role, alg='HS256'):
    header = {'alg': alg, 'typ': 'JWT'}
    payload = {
        'user_id': user_id,
        'role': role,
        'iss': 'sso.jafarovseclab.local'
    }
    
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    if alg == 'none':
        return f"{header_b64}.{payload_b64}."
    
    message = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = base64url_encode(hmac.new(JWT_SECRET.encode('utf-8'), message, hashlib.sha256).digest())
    
    return f"{header_b64}.{payload_b64}.{signature}"

def init_db():
    conn = sqlite3.connect(':memory:', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE users (
            user_id INTEGER PRIMARY KEY,
            email TEXT,
            password TEXT,
            full_name TEXT,
            phone TEXT,
            address TEXT,
            role TEXT
        )
    ''')
    cursor.execute("INSERT INTO users VALUES (995043202, 'user.a@example.com', 'password123', 'Alice Whitfield', '+1-555-0101', '1 Executive Plaza, NYC', 'System Admin')")
    cursor.execute("INSERT INTO users VALUES (552450897, 'user.b@example.com', 'password123', 'Bob Martinez', '+1-555-0102', '742 Evergreen Terrace', 'Standard User')")
    conn.commit()
    return conn

db_conn = init_db()

@app.route('/api/v8/login', methods=['POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        email = request.form.get('email') or (request.json and request.json.get('email'))
        password = request.form.get('password') or (request.json and request.json.get('password'))
        cursor = db_conn.cursor()
        cursor.execute("SELECT user_id, email, role FROM users WHERE email = ? AND password = ?", (email, password))
        row = cursor.fetchone()
        if row:
            jwt_token = create_jwt(row[0], row[2])
            session['email'] = row[1]
            session['user_id'] = row[0]
            session['jwt_token'] = jwt_token

            if request.is_json or request.path.endswith('/login') and request.method == 'POST' and not request.form:
                res = jsonify({'success': True, 'token': jwt_token})
            else:
                ref = request.headers.get('Referer', './')
                res = make_response(redirect(ref))

            res.set_cookie('auth_token', jwt_token, path='/')
            return res
        else:
            error = 'Invalid credentials'
            if request.is_json:
                return jsonify({'error': error}), 401

    return render_template('login.html', error=error)

@app.route('/logout')
@app.route('/scenario/8/logout')
@app.route('/scenario8/logout')
@app.route('/s8/logout')
def logout():
    session.clear()
    ref = request.headers.get('Referer', './')
    res = make_response(redirect(ref))
    res.set_cookie('auth_token', '', expires=0, path='/')
    return res

@app.route('/api/v8/user/profile', methods=['GET', 'POST'])
@app.route('/scenario/8/api/v8/user/profile', methods=['GET', 'POST'])
@app.route('/scenario8/api/v8/user/profile', methods=['GET', 'POST'])
@app.route('/s8/api/v8/user/profile', methods=['GET', 'POST'])
def profile_api():
    token = request.cookies.get('auth_token')
    if not token and 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

    if not token and request.method == 'POST' and request.json:
        token = request.json.get('token')

    if not token:
        return jsonify({'error': 'Missing authentication token'}), 401

    parts = token.split('.')
    if len(parts) < 2:
        return jsonify({'error': 'Malformed JWT token'}), 400

    try:
        header = json.loads(base64url_decode(parts[0]))
        payload = json.loads(base64url_decode(parts[1]))
        
        signature_valid = True
        alg = header.get('alg', 'HS256').lower()

        if alg == 'hs256':
            if len(parts) >= 3 and parts[2] != '':
                message = f"{parts[0]}.{parts[1]}".encode('utf-8')
                expected_sig = base64url_encode(hmac.new(JWT_SECRET.encode('utf-8'), message, hashlib.sha256).digest())
                if parts[2] != expected_sig:
                    signature_valid = False
            else:
                # Missing signature or empty signature -> Bypassed
                signature_valid = True
        elif alg == 'none':
            # None algorithm -> Bypassed
            signature_valid = True
        else:
            signature_valid = True

        if not signature_valid:
            return jsonify({'error': 'Invalid signature'}), 401

        user_id = payload.get('user_id')
        cursor = db_conn.cursor()
        cursor.execute("SELECT user_id, email, full_name, phone, address, role FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            user = {
                'user_id': row[0],
                'email': row[1],
                'full_name': row[2],
                'phone': row[3],
                'address': row[4],
                'role': row[5]
            }
            return jsonify({'success': True, 'data': user, 'token_alg': header.get('alg')})
        else:
            return jsonify({'error': 'User profile not found'}), 404
    except Exception as e:
        return jsonify({'error': f'JWT processing failed: {str(e)}'}), 400

@app.route('/', methods=['GET', 'POST'])
@app.route('/scenario/8', methods=['GET', 'POST'])
@app.route('/scenario8', methods=['GET', 'POST'])
@app.route('/s8', methods=['GET', 'POST'])
def index():
    if request.method == 'POST' and 'email' in request.form:
        return login()

    if 'email' not in session:
        return render_template('login.html', error=None)

    is_bob = session.get('user_id') == 552450897
    current_name = "Bob Martinez" if is_bob else "Alice Whitfield"
    token_preset = session.get('jwt_token', '')

    return render_template('index.html', current_name=current_name, token_preset=token_preset)

@app.route('/code', methods=['GET'])
@app.route('/scenario/8/code', methods=['GET'])
@app.route('/scenario8/code', methods=['GET'])
@app.route('/s8/code', methods=['GET'])
def code_viewer():
    return render_template('code.html')

@app.route('/code/file', methods=['GET'])
def get_code_file():
    name = request.args.get('name')
    allowed_files = ['app.py', 'templates/index.html', 'templates/login.html', 'requirements.txt', 'Dockerfile']
    if name not in allowed_files:
        return 'Forbidden', 403
    
    file_path = os.path.join(os.path.dirname(__file__), name)
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
    return 'Not Found', 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8088))
    app.run(host='0.0.0.0', port=port)
