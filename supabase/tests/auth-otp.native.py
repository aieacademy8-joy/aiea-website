#!/usr/bin/env python3
"""SNV01 regression for an existing synthetic adult in disposable LOCAL Supabase.

Run after local migrations and adult fixture setup. Required environment:
PORTAL_TEST_LOCAL_KEY, PORTAL_TEST_ADULT_EMAIL, PORTAL_TEST_ADULT_ID.
Optional: PORTAL_TEST_LOCAL_URL (default http://127.0.0.1:54321),
PORTAL_TEST_MAIL_URL (default http://127.0.0.1:54324).
Uses only ordinary Auth/Data API requests and local Mailpit; no admin key.
"""
import json
import os
import re
import time
import uuid
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen


def local_url(name, default):
    value = os.environ.get(name, default).rstrip('/')
    parsed = urlparse(value)
    if (parsed.scheme != 'http' or parsed.hostname not in ('127.0.0.1', 'localhost')
            or parsed.username or parsed.password or parsed.path or parsed.query
            or parsed.fragment):
        raise SystemExit('Only explicit loopback HTTP test endpoints are allowed')
    return value


API = local_url('PORTAL_TEST_LOCAL_URL', 'http://127.0.0.1:54321')
MAIL = local_url('PORTAL_TEST_MAIL_URL', 'http://127.0.0.1:54324')
KEY = os.environ['PORTAL_TEST_LOCAL_KEY']
EMAIL = os.environ['PORTAL_TEST_ADULT_EMAIL']
ADULT = str(uuid.UUID(os.environ['PORTAL_TEST_ADULT_ID']))
if not EMAIL.endswith('@example.invalid'):
    raise SystemExit('Use a synthetic @example.invalid adult fixture')
count = 0


def check(condition, label):
    global count
    if not condition:
        raise SystemExit('FAIL ' + label)
    count += 1
    print('PASS ' + label, flush=True)


def request(path, body=None, token=None):
    headers = {'apikey': KEY, 'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if path.startswith('/rest/v1/'):
        headers['Accept-Profile'] = 'portal'
    req = Request(API + path, headers=headers,
                  data=json.dumps(body).encode() if body is not None else None)
    try:
        with urlopen(req, timeout=15) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        return error.code, json.load(error)


def mail_json(path):
    with urlopen(MAIL + path, timeout=15) as response:
        return json.load(response)


status, settings = request('/auth/v1/settings')
check(status == 200 and settings['external']['email'] is True,
      'SNV01 email provider enabled')
check(settings['disable_signup'] is True and
      settings['external']['anonymous_users'] is False,
      'SNV01 public signup and anonymous authentication remain disabled')
old_ids = {m['ID'] for m in mail_json('/api/v1/messages')['messages']}
status, _ = request('/auth/v1/otp', {'email': EMAIL, 'create_user': False})
check(status == 200, 'SNV01 ordinary existing-adult OTP request succeeds')
message = None
deadline = time.monotonic() + 10
while time.monotonic() < deadline:
    for candidate in mail_json('/api/v1/messages')['messages']:
        if candidate['ID'] not in old_ids and any(
                recipient.get('Address') == EMAIL for recipient in candidate['To']):
            message = mail_json('/api/v1/message/' + candidate['ID'])
            break
    if message:
        break
    time.sleep(0.2)
check(message is not None, 'SNV01 local email delivery captured for exact adult')
links = [s.replace('&amp;', '&') for s in re.findall(
    r'https?[^\s<>"\']+', message.get('Text', '') + ' ' + message.get('HTML', ''))
    if '/auth/v1/verify?' in s]
check(bool(links) and urlparse(links[0]).netloc == urlparse(API).netloc,
      'SNV01 delivered verification link targets local Auth')
params = parse_qs(urlparse(links[0]).query)
payload = {'type': params['type'][0], 'token_hash': params['token'][0]}
status, session = request('/auth/v1/verify', payload)
check(status == 200 and bool(session.get('access_token')),
      'SNV01 emailed one-time token verifies successfully')
status, adult = request('/auth/v1/user', token=session['access_token'])
check(status == 200 and adult['id'] == ADULT and not adult['is_anonymous'],
      'SNV01 Auth validates exact non-anonymous adult session')
status, profile = request('/rest/v1/user_profile?select=user_id,status,adult_confirmed_at',
                          token=session['access_token'])
check(status == 200 and len(profile) == 1 and profile[0]['user_id'] == ADULT
      and profile[0]['status'] == 'ACTIVE' and bool(profile[0]['adult_confirmed_at']),
      'SNV01 session resolves to pre-existing active adult profile')
status, _ = request('/auth/v1/verify', payload)
check(status in (400, 401, 403, 422), 'SNV01 consumed one-time token replay denied')
unknown = 'snv01-unknown-' + uuid.uuid4().hex + '@example.invalid'
for body, label in [({'email': unknown, 'create_user': False}, 'unknown adult OTP'),
                    ({'email': unknown, 'create_user': True}, 'OTP implicit signup')]:
    status, result = request('/auth/v1/otp', body)
    check(status in (400, 401, 403, 422) and result.get('error_code')
          and not result.get('access_token'),
          'SNV01 ' + label + ' denied: ' + str(result.get('error_code')))
status, result = request('/auth/v1/signup', {'email': unknown, 'password': uuid.uuid4().hex})
check(status in (400, 401, 403, 422) and result.get('error_code')
      and not result.get('access_token'),
      'SNV01 public email signup denied: ' + str(result.get('error_code')))
status, result = request('/auth/v1/signup', {'data': {}})
check(status in (400, 401, 403, 422) and result.get('error_code')
      and not result.get('access_token'),
      'SNV01 anonymous signup/sign-in denied: ' + str(result.get('error_code')))
print('PASS ' + str(count) + ' SNV01 local Auth regression checks')
