import sqlite3
import os
from flask import Flask, request, jsonify, render_template, redirect, session

app = Flask(__name__)
app.secret_key = 'super_secret_wealth_key'

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
            balance TEXT,
            role TEXT
        )
    ''')
    cursor.execute("INSERT INTO users VALUES (1230, 'alice.ceo@corp.com', 'password123', 'Alice Whitfield', '+1-555-0101', '$4,850,000.00', 'VIP Platinum Account')")
    cursor.execute("INSERT INTO users VALUES (123, 'bob.martinez@corp.com', 'password123', 'Bob Martinez', '+1-555-0102', '$12,450.00', 'Standard Checking')")
    conn.commit()
    return conn

db_conn = init_db()

@app.route('/', methods=['GET', 'POST'])
@app.route('/scenario/2', methods=['GET', 'POST'])
@app.route('/scenario2', methods=['GET', 'POST'])
@app.route('/s2', methods=['GET', 'POST'])
@app.route('/scenario/2/logout', methods=['GET'])
@app.route('/scenario2/logout', methods=['GET'])
@app.route('/s2/logout', methods=['GET'])
@app.route('/logout', methods=['GET'])
def index():
    # Handle logout path
    if request.path.endswith('/logout'):
        session.clear()
        ref = request.headers.get('Referer', './')
        return redirect(ref)

    error = None
    if request.method == 'POST' and 'email' in request.form:
        email = request.form.get('email')
        password = request.form.get('password')
        cursor = db_conn.cursor()
        cursor.execute("SELECT user_id, email FROM users WHERE (email = ? OR email = 'user.b@example.com' OR email = 'user.a@example.com') AND password = ?", (email, password))
        row = cursor.fetchone()
        if row:
            session['email'] = row[1]
            session['user_id'] = row[0]
            ref = request.headers.get('Referer', './')
            return redirect(ref)
        else:
            error = 'Invalid credentials'

    if 'email' not in session:
        return render_template('login.html', error=error)

    user_id = request.args.get('user_id')
    session_user_id = request.args.get('session_user_id')
    
    statement_user = None
    error = None

    if user_id and session_user_id:
        if not str(user_id).startswith(str(session_user_id)):
            error = "Access denied: Security prefix mismatch"
        else:
            try:
                numeric_id = int(float(user_id))
                cursor = db_conn.cursor()
                cursor.execute("SELECT user_id, email, full_name, phone, balance, role FROM users WHERE user_id = ?", (numeric_id,))
                row = cursor.fetchone()
                if row:
                    statement_user = {
                        'user_id': row[0],
                        'email': row[1],
                        'full_name': row[2],
                        'phone': row[3],
                        'balance': row[4],
                        'role': row[5]
                    }
                else:
                    error = "User not found"
            except ValueError:
                error = "Invalid user ID format"

    is_bob = session['user_id'] == 123
    current_name = "Bob Martinez" if is_bob else "Alice Whitfield"
    current_id = 123 if is_bob else 1230

    return render_template('index.html', current_name=current_name, current_id=current_id, statement_user=statement_user, error=error)

@app.route('/code', methods=['GET'])
@app.route('/scenario/2/code', methods=['GET'])
@app.route('/scenario2/code', methods=['GET'])
@app.route('/s2/code', methods=['GET'])
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
    port = int(os.environ.get('PORT', 8082))
    app.run(host='0.0.0.0', port=port)
