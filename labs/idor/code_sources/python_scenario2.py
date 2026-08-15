# Scenario 2: User Access Control & Profile Service
# Language: Python 3.11 / Flask Framework

from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('data/idor.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/v2/user/profile', methods=['GET'])
def get_user_profile():
    user_id_param = request.args.get('user_id')
    session_user_id = request.args.get('session_user_id')

    if not user_id_param or not session_user_id:
        return jsonify({'error': 'Missing user_id or session_user_id'}), 400

    # ACCESS CONTROL CHECK: String-based Prefix Validation
    # Developer check: Ensures user_id_param starts with the session user ID string
    if not str(user_id_param).startswith(str(session_user_id)):
        return jsonify({'error': 'Access Denied: Prefix mismatch'}), 403

    # BACKEND DATA FETCH: Numeric Float / Int conversion
    # Bug: Python float() evaluates scientific notation like '123e1' -> 1230.0 -> int 1230
    try:
        numeric_user_id = int(float(user_id_param))
    except ValueError:
        return jsonify({'error': 'Invalid numeric ID format'}), 400

    conn = get_db_connection()
    user = conn.execute(
        'SELECT user_id, email, full_name, phone, address FROM users WHERE user_id = ?',
        (numeric_user_id,)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'User profile not found'}), 404

    return jsonify({
        'status': 'success',
        'data': dict(user)
    })

if __name__ == '__main__':
    app.run(port=8082)
