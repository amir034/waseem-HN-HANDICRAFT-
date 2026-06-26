#!/usr/bin/env python3
"""Static site + shared auth API (same credentials on every device)."""
import base64
import json
import os
import re
import time
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, 'data')
DATA_FILE = os.path.join(DATA_DIR, 'site-store.json')
CONTENT_FILE = os.path.join(DATA_DIR, 'site-content.json')
UPLOAD_DIR = os.path.join(ROOT, 'assets', 'uploads')
PORT = 8080
ADMIN_EMAIL = 'admin@gmail.com'


def load_store():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        save_store({'users': []})
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_store(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_site_content():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CONTENT_FILE):
        return {'content': {}}
    with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_site_content(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CONTENT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def save_uploaded_image(data_url):
    if not data_url or not str(data_url).startswith('data:image'):
        raise ValueError('Invalid image data.')
    header, encoded = str(data_url).split(',', 1)
    ext = 'jpg'
    if 'png' in header:
        ext = 'png'
    elif 'webp' in header:
        ext = 'webp'
    elif 'gif' in header:
        ext = 'gif'
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    name = f'img_{int(time.time() * 1000)}.{ext}'
    file_path = os.path.join(UPLOAD_DIR, name)
    with open(file_path, 'wb') as handle:
        handle.write(base64.b64decode(encoded))
    return f'/assets/uploads/{name}'


def normalize_email(email):
    return (email or '').strip().lower()


def find_user(users, email):
    email = normalize_email(email)
    for user in users:
        if normalize_email(user.get('email')) == email:
            return user
    return None


class SiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        if args and str(args[0]).startswith('GET /api'):
            return
        super().log_message(fmt, *args)

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode('utf-8'))

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/health':
            self.send_json({'ok': True, 'persist': True, 'siteSync': True})
            return
        if path == '/api/site-content':
            self.send_json(load_site_content())
            return
        if path == '/api/users':
            store = load_store()
            users = [{**u, 'password': u.get('password', '')} for u in store.get('users', [])]
            self.send_json({'users': users})
            return
        super().do_GET()

    def do_PUT(self):
        path = urlparse(self.path).path

        if path == '/api/site-content':
            payload = self.read_json()
            content = payload.get('content')
            if not isinstance(content, dict):
                self.send_json({'success': False, 'message': 'Invalid content payload.'}, 400)
                return
            save_site_content({
                'content': content,
                'updatedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            })
            self.send_json({'success': True})
            return

        if path == '/api/users/update':
            payload = self.read_json()
            email = normalize_email(payload.get('email'))
            if not email or email == ADMIN_EMAIL:
                self.send_json({'success': False, 'message': 'Invalid user.'}, 400)
                return
            store = load_store()
            users = store.setdefault('users', [])
            user = find_user(users, email)
            if not user:
                self.send_json({'success': False, 'message': 'User not found.'}, 404)
                return
            for key, value in payload.items():
                if key not in ('email', 'id'):
                    user[key] = value
            user['email'] = email
            save_store(store)
            self.send_json({'success': True, 'user': user})
            return

        if path != '/api/users':
            self.send_error(404)
            return
        payload = self.read_json()
        users = payload.get('users')
        if not isinstance(users, list):
            self.send_json({'success': False, 'message': 'Invalid users payload.'}, 400)
            return
        store = load_store()
        merged = {}
        for user in store.get('users', []):
            email = normalize_email(user.get('email'))
            if email and email != ADMIN_EMAIL:
                merged[email] = user
        for user in users:
            email = normalize_email(user.get('email'))
            if not email or email == ADMIN_EMAIL:
                continue
            existing = merged.get(email, {})
            merged[email] = {**existing, **user, 'email': email}
        store['users'] = list(merged.values())
        save_store(store)
        self.send_json({'success': True, 'users': store['users']})

    def do_POST(self):
        path = urlparse(self.path).path
        payload = self.read_json()

        if path == '/api/upload':
            try:
                url = save_uploaded_image(payload.get('data'))
            except ValueError as err:
                self.send_json({'success': False, 'message': str(err)}, 400)
                return
            except Exception:
                self.send_json({'success': False, 'message': 'Upload failed.'}, 500)
                return
            self.send_json({'success': True, 'url': url})
            return

        if path == '/api/auth/signup':
            name = (payload.get('name') or '').strip()
            email = normalize_email(payload.get('email'))
            password = payload.get('password') or ''

            if not name or not email or not password:
                self.send_json({'success': False, 'message': 'All fields are required.'}, 400)
                return
            if email == ADMIN_EMAIL:
                self.send_json({'success': False, 'message': 'This email is reserved for admin use.'}, 400)
                return
            if len(password) < 6:
                self.send_json({'success': False, 'message': 'Password must be at least 6 characters.'}, 400)
                return
            if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
                self.send_json({'success': False, 'message': 'Please enter a valid email address.'}, 400)
                return

            store = load_store()
            users = store.setdefault('users', [])
            if find_user(users, email):
                self.send_json({'success': False, 'message': 'An account with this email already exists.'}, 409)
                return

            user = {
                'id': 'user_' + str(int(__import__('time').time() * 1000)),
                'name': name,
                'email': email,
                'password': password,
                'addresses': [],
                'loginCount': 1,
                'lastLogin': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
                'createdAt': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
            }
            users.append(user)
            save_store(store)
            safe = {k: v for k, v in user.items() if k != 'password'}
            self.send_json({'success': True, 'user': safe})
            return

        if path == '/api/auth/login':
            email = normalize_email(payload.get('email'))
            password = payload.get('password') or ''
            if not email or not password:
                self.send_json({'success': False, 'message': 'Email and password are required.'}, 400)
                return

            store = load_store()
            user = find_user(store.get('users', []), email)
            if not user or user.get('password') != password:
                self.send_json({'success': False, 'message': 'Invalid email or password.'}, 401)
                return

            user['loginCount'] = int(user.get('loginCount') or 0) + 1
            user['lastLogin'] = __import__('datetime').datetime.utcnow().isoformat() + 'Z'
            save_store(store)
            safe = {k: v for k, v in user.items() if k != 'password'}
            self.send_json({'success': True, 'user': safe})
            return

        self.send_error(404)


def main():
    try:
        server = ThreadingHTTPServer(('0.0.0.0', PORT), SiteHandler)
    except OSError as err:
        print(f'Could not start on port {PORT}: {err}', flush=True)
        print('Stop any other server on this port, then run: python server.py', flush=True)
        raise SystemExit(1) from err

    print(f'HN Handicraft site running at http://localhost:{PORT}', flush=True)
    print(f'On your phone (same Wi-Fi): http://<your-pc-ip>:{PORT}', flush=True)
    print('Accounts, offers, products, and uploads sync via data/site-content.json', flush=True)
    print('Uploaded images are saved to assets/uploads/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.', flush=True)


if __name__ == '__main__':
    main()
