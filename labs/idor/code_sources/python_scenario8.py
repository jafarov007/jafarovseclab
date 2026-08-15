# Scenario 8: JWT Authentication Service
# Language: Python 3.11 / PyJWT Library

from flask import Flask, request, jsonify
import jwt

app = Flask(__name__)
JWT_SECRET = "super_secret_key_123"

@app.route('/api/v8/user/profile', methods=['GET'])
def get_profile():
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing Bearer token'}), 401

    token = auth_header.split(' ')[1]

    try:
        # VULNERABLE JWT DECODING LOGIC:
        # options={"verify_signature": False} or allowing algorithm 'none'
        # PyJWT improperly configured allows unsigned or manipulated JWT payloads!
        unverified_header = jwt.get_unverified_header(token)

        if unverified_header.get('alg', '').lower() == 'none':
            # Algorithm None bypass path: decode without signature validation
            payload = jwt.decode(token, options={"verify_signature": False})
        else:
            payload = jwt.decode(token, options={"verify_signature": False})

        target_user_id = payload.get('user_id')

        # Return target profile without verifying user ownership
        return jsonify({
            'status': 'success',
            'jwt_bypass_type': unverified_header.get('alg'),
            'data': {
                'user_id': target_user_id,
                'email': f'user_{target_user_id}@example.com',
                'role': 'user'
            }
        })

    except Exception as e:
        return jsonify({'error': 'JWT Processing Error', 'details': str(e)}), 400

if __name__ == '__main__':
    app.run(port=8088)
