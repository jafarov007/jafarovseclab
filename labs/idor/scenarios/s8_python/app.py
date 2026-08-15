import sqlite3
import os
import base64
import json
import hmac
import hashlib
from flask import Flask, request, jsonify, render_template, redirect, session

app = Flask(__name__)
app.secret_key = 'super_secret_jwt_key'

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
    cursor.execute("INSERT INTO users VALUES (995043202, 'alice.ceo@corp.com', 'password123', 'Alice Whitfield', '+1-555-0101', '1 Executive Plaza, NYC', 'System Admin')")
    cursor.execute("INSERT INTO users VALUES (552450897, 'bob.martinez@corp.com', 'password123', 'Bob Martinez', '+1-555-0102', '742 Evergreen Terrace', 'Standard User')")
    conn.commit()
    return conn

db_conn = init_db()

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        cursor = db_conn.cursor()
        cursor.execute("SELECT user_id, email, role FROM users WHERE (email = ? OR email = 'user.b@example.com' OR email = 'user.a@example.com') AND password = ?", (email, password))
        row = cursor.fetchone()
        if row:
            session['email'] = row[1]
            session['user_id'] = row[0]
            session['jwt_token'] = create_jwt(row[0], row[2])
            ref = request.headers.get('Referer', './')
            return redirect(ref)
        else:
            error = 'Invalid credentials'

    return render_template('login.html', error=error)

@app.route('/logout')
@app.route('/scenario/8/logout')
@app.route('/scenario8/logout')
@app.route('/s8/logout')
def logout():
    session.clear()
    ref = request.headers.get('Referer', './')
    return redirect(ref)

@app.route('/', methods=['GET', 'POST'])
@app.route('/scenario/8', methods=['GET', 'POST'])
@app.route('/scenario8', methods=['GET', 'POST'])
@app.route('/s8', methods=['GET', 'POST'])
def index():
    if request.method == 'POST' and 'email' in request.form:
        return login()

    if 'email' not in session:
        return login()

    api_response = None
    submit_token = None

    if request.method == 'POST':
        submit_token = request.form.get('token', '').strip()
        if submit_token:
            parts = submit_token.split('.')
            if len(parts) < 2:
                api_response = json.dumps({'error': 'Malformed JWT token'}, indent=2)
            else:
                try:
                    header = json.loads(base64url_decode(parts[0]))
                    payload = json.loads(base64url_decode(parts[1]))
                    
                    signature_valid = True
                    if header.get('alg') == 'HS256':
                        message = f"{parts[0]}.{parts[1]}".encode('utf-8')
                        expected_sig = base64url_encode(hmac.new(JWT_SECRET.encode('utf-8'), message, hashlib.sha256).digest())
                        if len(parts) < 3 or parts[2] != expected_sig:
                            signature_valid = False
                    elif header.get('alg') == 'none' or len(parts) == 2 or parts[2] == '':
                        pass
                    else:
                        signature_valid = False

                    if not signature_valid:
                        api_response = json.dumps({'error': 'Invalid signature'}, indent=2)
                    else:
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
                            api_response = json.dumps({
                                'success': True,
                                'data': user
                            }, indent=2)
                        else:
                            api_response = json.dumps({'error': 'User not found'}, indent=2)
                except Exception as e:
                    api_response = json.dumps({'error': f'Failed to decode: {str(e)}'}, indent=2)

    is_bob = session['user_id'] == 552450897
    current_name = "Bob Martinez" if is_bob else "Alice Whitfield"
    token_preset = session['jwt_token']

    return render_template('index.html', current_name=current_name, token_preset=token_preset, submit_token=submit_token, api_response=api_response)

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
