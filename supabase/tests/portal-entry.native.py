#!/usr/bin/env python3
"""Sprint 01B synthetic LOCAL numeric OTP/runtime regression.

Requires a clean disposable migrated stack with the numeric template overlay,
PORTAL_ORIGIN=http://localhost:4321, running serve-local.mjs and private CLI JSON
path in AIEA_LOCAL_CREDENTIALS. --setup creates test fixtures only. No hosted URLs,
real email, production schema changes, secrets in output or implicit signup.
"""
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[2]
CREDS = Path(os.environ['AIEA_LOCAL_CREDENTIALS'])
C = json.loads(CREDS.read_text())
if C.get('API_URL') != 'http://127.0.0.1:54321':
    raise SystemExit('Disposable loopback Supabase only')
APP = 'http://localhost:4321'
MAIL = 'http://127.0.0.1:54324'
STATE = CREDS.parent / 'portal-fixtures.json'
FAMILY = '10000000-0000-0000-0000-000000000002'
SCHOOL = '10000000-0000-0000-0000-000000000001'
OTHER = '10000000-0000-0000-0000-000000000003'
RESULTS = []


def check(label, condition):
    RESULTS.append({'label': label, 'pass': bool(condition)})
    print(('PASS ' if condition else 'FAIL ') + label, flush=True)
    if not condition:
        raise SystemExit('Local Portal expectation failed: ' + label)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def request(base, path, body=None, token=None, cookie=None, admin=False, origin=APP):
    headers = {}
    if base == C['API_URL']:
        headers['apikey'] = C['SECRET_KEY'] if admin else C['PUBLISHABLE_KEY']
        if admin:
            token = C['SERVICE_ROLE_KEY']
        if token:
            headers['Authorization'] = 'Bearer ' + token
        if path.startswith('/rest/'):
            headers['Accept-Profile'] = 'portal'
    if cookie:
        headers['Cookie'] = cookie
    if body is not None:
        headers['Content-Type'] = 'application/json'
        if origin:
            headers['Origin'] = origin
    req = urllib.request.Request(base + path, headers=headers,
                                 data=None if body is None else json.dumps(body).encode())
    try:
        response = urllib.request.build_opener(NoRedirect).open(req, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    raw = response.read()
    try:
        data = json.loads(raw)
    except ValueError:
        data = raw.decode()
    return response.code, data, response.headers


def sql(statement):
    r = subprocess.run(['docker', 'exec', '-i', 'supabase_db_aiea-portal-local', 'psql',
                        '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'],
                       input=statement, text=True, capture_output=True)
    if r.returncode:
        raise SystemExit('Local synthetic SQL fixture/probe failed; details omitted')
    return r.stdout.strip()


def quote(value):
    return "'" + value.replace("'", "''") + "'"


def claims(token):
    part = token.split('.')[1]
    return json.loads(base64.urlsafe_b64decode(part + '=' * (-len(part) % 4)))


def setup():
    if sql('select count(*) from portal.user_profile;') != '0':
        raise SystemExit('Use a clean disposable stack for --setup')
    users, tokens = {}, {}
    for n in range(1, 16):
        email = 'portal-01b-' + str(n) + '-' + uuid.uuid4().hex + '@example.invalid'
        status, u, _ = request(C['API_URL'], '/auth/v1/admin/users',
                                {'email': email, 'email_confirm': True}, admin=True)
        if status != 200:
            raise SystemExit('Synthetic adult provisioning failed')
        users[str(n)] = {'id': u['id'], 'email': email}
        status, link, _ = request(C['API_URL'], '/auth/v1/admin/generate_link',
                                   {'type': 'magiclink', 'email': email}, admin=True)
        if status != 200:
            raise SystemExit('Synthetic fixture session failed')
        status, session, _ = request(C['API_URL'], '/auth/v1/verify',
                                      {'type': 'magiclink', 'token_hash': link['hashed_token']})
        if status != 200:
            raise SystemExit('Synthetic fixture verification failed')
        tokens[str(n)] = session['access_token']
    # Genuine managed assurance for fixture publication; never a production recipe.
    token = tokens['1']
    st, factor, _ = request(C['API_URL'], '/auth/v1/factors',
                             {'factor_type': 'totp', 'friendly_name': '01B fixture publication'}, token)
    if st != 200:
        raise SystemExit('Synthetic TOTP setup failed')
    st, challenge, _ = request(C['API_URL'], '/auth/v1/factors/' + factor['id'] + '/challenge', {}, token)
    secret = factor['totp']['secret']
    key = base64.b32decode(secret + '=' * (-len(secret) % 8))
    digest = hmac.new(key, struct.pack('>Q', int(time.time()) // 30), hashlib.sha1).digest()
    offset = digest[-1] & 15
    code = str((struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7fffffff) % 1000000).zfill(6)
    st, session, _ = request(C['API_URL'], '/auth/v1/factors/' + factor['id'] + '/verify',
                              {'challenge_id': challenge['id'], 'code': code}, token)
    if st != 200:
        raise SystemExit('Synthetic genuine assurance failed')
    source = (ROOT / 'supabase/tests/foundation.sql').read_text().split("select pg_temp.ok((select count(*)=28")[0]
    source = source[:source.index('-- Synthetic managed assurance fixtures')] + source[source.index('insert into portal.user_profile'):]
    source = '\n'.join(line for line in source.splitlines() if not line.startswith('insert into auth.users(id)') and not line.startswith('select pg_temp.denied('))
    source = source.replace("select id,now() from auth.users where id::text like '00000000-0000-0000-0000-%'",
                            'select id,now() from auth.users where id in (' + ','.join(quote(users[str(n)]['id']) for n in range(1, 6)) + ')')
    for n in range(1, 6):
        source = source.replace('00000000-0000-0000-0000-' + str(n).zfill(12), users[str(n)]['id'])
    source = re.sub(r"select set_config\('request.jwt.claims','[^']*',true\);",
                    lambda _: "select set_config('request.jwt.claims'," + quote(json.dumps(claims(session['access_token']))) + ',true);', source, count=1)
    sql(source + '\ncommit;')
    for n in range(7, 16):
        sql('insert into portal.user_profile(user_id,adult_confirmed_at,status) values (' + quote(users[str(n)]['id']) +
            ",now()," + ("'INACTIVE'" if n == 7 else "'ACTIVE'") + ');')
    sql("insert into portal.workspace_membership(workspace_id,workspace_kind,user_id,role) values (" + quote(FAMILY) + ",'FAMILY'," +
        quote(users['8']['id']) + ",'OWNER'),(" + quote(SCHOOL) + ",'SCHOOL'," + quote(users['8']['id']) + ",'TEACHER');")
    # Separate fresh synthetic adults for the bounded two-window audit regression.
    for n, workspace, kind, role in [(11, FAMILY, 'FAMILY', 'OWNER'), (12, FAMILY, 'FAMILY', 'OWNER'), (13, SCHOOL, 'SCHOOL', 'TEACHER'), (14, FAMILY, 'FAMILY', 'OWNER'), (15, SCHOOL, 'SCHOOL', 'TEACHER')]:
        sql('insert into portal.workspace_membership(workspace_id,workspace_kind,user_id,role) values (' +
            quote(workspace) + ',' + quote(kind) + ',' + quote(users[str(n)]['id']) + ',' + quote(role) + ');')
    STATE.write_text(json.dumps(users)); STATE.chmod(0o600)
    print('Synthetic LOCAL Portal fixtures ready; no issued tokens persisted', flush=True)


def code_for(email):
    with urllib.request.urlopen(MAIL + '/api/v1/messages', timeout=15) as r:
        old = {m['ID'] for m in json.load(r)['messages']}
    st, data, h = request(APP, '/api/portal/auth', {'action': 'request', 'email': email})
    check('numeric OTP request succeeds for synthetic existing adult', st == 200 and data == {'requested': True})
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        with urllib.request.urlopen(MAIL + '/api/v1/messages', timeout=15) as r:
            messages = json.load(r)['messages']
        for m in messages:
            if m['ID'] not in old and any(x.get('Address') == email for x in m['To']):
                with urllib.request.urlopen(MAIL + '/api/v1/message/' + m['ID'], timeout=15) as r:
                    message = json.load(r)
                text = message.get('Text', '') + message.get('HTML', '')
                values = set(re.findall(r'\b\d{6}\b', text))
                check('delivered numeric template has one code and no verification link', len(values) == 1 and '/auth/v1/verify?' not in text)
                return next(iter(values))
        time.sleep(.1)
    raise SystemExit('Numeric local mail did not arrive')


def verify(email, code):
    return request(APP, '/api/portal/auth', {'action': 'verify', 'email': email, 'code': code})


def main():
    users = json.loads(STATE.read_text())
    st, _, h = request(APP, '/portal')
    check('anonymous protected entry redirects to fixed login', st == 303 and h['Location'] == '/portal/login.html')
    st, _, _ = request(APP, '/api/portal/context')
    check('anonymous direct context denied', st == 401)
    for n in ('2', '3', '4', '5', '6', '7'):
        email = users[n]['email']; code = code_for(email)
        if n == '2':
            st, _, _ = verify('unknown@example.invalid', code)
            check('numeric code cannot authenticate a different email', st == 401)
            st, _, _ = verify(email, '000000' if code != '000000' else '111111')
            check('incorrect numeric code denied', st == 401)
        st, data, h = verify(email, code)
        if n in ('6', '7'):
            check('missing/inactive adult profile denies actual signed Auth session ' + n,
                  st == 403 and 'Max-Age=0' in h.get('Set-Cookie', '') and 'access_token' not in json.dumps(data))
            continue
        cookie = h.get('Set-Cookie', '').split(';')[0]
        check('numeric verification issues server cookie without JSON token ' + n,
              st == 200 and data == {'authenticated': True} and 'HttpOnly' in h.get('Set-Cookie', '') and
              'refresh' not in h.get('Set-Cookie', '') and 'SameSite=Lax' in h.get('Set-Cookie', ''))
        users[n]['cookie'] = cookie
        st, _, _ = verify(email, code)
        check('consumed numeric code replay denied ' + n, st == 401)
        st, html, h = request(APP, '/portal', cookie=cookie)
        check('actual session opens protected shell ' + n, st == 200 and 'workspace-select' in html and cookie.split('=', 1)[1] not in html)
        st, data, h = request(APP, '/api/portal/context', cookie=cookie)
        check('private context no-store and permitted projection ' + n,
              st == 200 and 'no-store' in h['Cache-Control'] and not any(x in json.dumps(data) for x in ('billing_reference', 'access_token', 'refresh_token', 'stripe_')))
        if n == '5':
            check('existing unaffiliated adult gets zero-workspace empty state', data['workspaces'] == [] and data['selected_workspace_id'] is None)
        else:
            expected_kind, role = ('FAMILY', 'OWNER') if n == '2' else ('SCHOOL', 'TEACHER' if n == '3' else 'SCHOOL_ADMIN')
            check('existing kind/role is explicit and single workspace selected ' + n,
                  len(data['workspaces']) == 1 and data['workspaces'][0]['kind'] == expected_kind and data['workspaces'][0]['role'] == role and data['selected_workspace_id'])
            check('bounded entitlement summary only ' + n,
                  len(data['entitlements']) == 1 and set(data['entitlements'][0]) == {'id', 'program_version_id', 'status'})
    cookie = users['2']['cookie']
    st, _, _ = request(APP, '/api/portal/context?workspace_id=' + SCHOOL, cookie=cookie)
    check('forged cross-tenant workspace selection denied', st == 403)
    st, _, _ = request(APP, '/api/portal/context', cookie=cookie)
    check('failed workspace selection does not revoke valid account session', st == 200)
    st, _, _ = request(APP, '/api/portal/context?token=legacy-pdf', cookie=cookie)
    check('legacy PDF/query credential rejected as Portal input', st == 400)
    st, _, _ = request(APP, '/api/portal/auth', {'action': 'signout'}, cookie=cookie, origin='https://evil.example.invalid')
    check('real HTTP cross-origin signout denied', st == 403)
    teacher_cookie = users['3']['cookie']
    teacher_token = teacher_cookie.split('=', 1)[1]
    for table, count in [('cohort', 1), ('learner_ref', 1)]:
        st, data, _ = request(C['API_URL'], '/rest/v1/' + table + '?select=id', token=teacher_token)
        check('unchanged teacher RLS exposes assigned ' + table + ' only', st == 200 and len(data) == count)
    sql("update portal.workspace_membership set status='REVOKED' where user_id=" + quote(users['3']['id']) + ';')
    st, _, _ = request(APP, '/api/portal/context?workspace_id=' + SCHOOL, cookie=teacher_cookie)
    check('membership revocation takes effect on next runtime request', st == 403)
    sql("update portal.workspace_membership set status='ACTIVE' where user_id=" + quote(users['3']['id']) + ';')
    sql("update portal.cohort_teacher_assignment set status='REVOKED';")
    st, data, _ = request(C['API_URL'], '/rest/v1/learner_ref?select=id', token=teacher_token)
    check('cohort assignment revocation retains accepted learner privacy', st == 200 and data == [])
    sql("update portal.cohort_teacher_assignment set status='ACTIVE';")
    sql("update portal.workspace set status='INACTIVE' where id=" + quote(FAMILY) + ';')
    st, _, _ = request(APP, '/api/portal/context?workspace_id=' + FAMILY, cookie=cookie)
    check('inactive workspace denied on next request', st == 403)
    sql("update portal.workspace set status='ACTIVE' where id=" + quote(FAMILY) + ';')
    for status in ('SUSPENDED', 'REVOKED', 'ACTIVE'):
        sql('update portal.entitlement set status=' + quote(status) + ' where workspace_id=' + quote(FAMILY) + ';')
        st, data, _ = request(APP, '/api/portal/context', cookie=cookie)
        check('current entitlement summary reflects ' + status, st == 200 and data['entitlements'][0]['status'] == status)
    sql("update portal.user_profile set status='INACTIVE' where user_id=" + quote(users['2']['id']) + ';')
    st, _, h = request(APP, '/api/portal/context', cookie=cookie)
    check('active profile revalidated and cookie cleared after deactivation', st == 403 and 'Max-Age=0' in h.get('Set-Cookie', ''))
    sql("update portal.user_profile set status='ACTIVE' where user_id=" + quote(users['2']['id']) + ';')
    token = cookie.split('=', 1)[1]
    st, _, _ = request(APP, '/api/portal/context', cookie='aiea_portal_local=' + token[:-1] + ('x' if token[-1] != 'x' else 'y'))
    check('real signature corruption denied by Auth', st == 401)
    cl = claims(token); cl['exp'] = int(time.time()) - 120
    head = base64.urlsafe_b64encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode()).decode().rstrip('=')
    payload = base64.urlsafe_b64encode(json.dumps(cl).encode()).decode().rstrip('=')
    unsigned = head + '.' + payload
    sig = base64.urlsafe_b64encode(hmac.new(C['JWT_SECRET'].encode(), unsigned.encode(), hashlib.sha256).digest()).decode().rstrip('=')
    st, _, _ = request(APP, '/api/portal/context', cookie='aiea_portal_local=' + unsigned + '.' + sig)
    check('correctly signed expired local token denied', st == 401)
    expiry_email = users['9']['email']; expiry_code = code_for(expiry_email)
    sql("update auth.users set recovery_sent_at=now()-interval '2 hours' where id=" + quote(users['9']['id']) + ';')
    st, _, _ = verify(expiry_email, expiry_code)
    check('native numeric OTP expiry comparison denies aged token', st == 401)
    email = users['10']['email']; code_for(email)
    st, data, _ = request(APP, '/api/portal/auth', {'action': 'request', 'email': email})
    check('native immediate resend throttling is surfaced', st == 429 and data.get('error') == 'try_again_later')
    before = sql('select count(*) from auth.users;')
    unknown = 'unknown-01b-' + uuid.uuid4().hex + '@example.invalid'
    st, data, _ = request(APP, '/api/portal/auth', {'action': 'request', 'email': unknown})
    check('unknown account gets generic response without signup', st == 200 and data == {'requested': True})
    for path, body in [('/auth/v1/otp', {'email': unknown, 'create_user': True}),
                       ('/auth/v1/signup', {'email': unknown, 'password': uuid.uuid4().hex}), ('/auth/v1/signup', {})]:
        st, data, _ = request(C['API_URL'], path, body)
        check('native global signup/anonymous boundary remains denied ' + path + str(len(body)),
              st in (400,401,403,422) and bool(data.get('error_code')))
    check('unknown and signup attempts create no Auth identity', before == sql('select count(*) from auth.users;'))
    st, data, h = request(APP, '/api/portal/auth', {'action': 'signout'}, cookie=cookie)
    check('current-session signout succeeds and expires application cookie', st == 200 and data == {'signed_out': True} and 'Max-Age=0' in h.get('Set-Cookie', ''))
    st, _, _ = request(APP, '/api/portal/context', cookie=cookie)
    check('old signed-out cookie is refused by runtime Auth check', st == 401)
    st, _, _ = request(C['API_URL'], '/rest/v1/workspace?select=id', token=token)
    check('SNV06 ordinary Data API behavior remains unchanged', st == 200)
    # Browser-only adult (8) remains untouched by API OTP tests.
    (CREDS.parent / 'portal-entry-results.json').write_text(json.dumps(RESULTS, indent=2))
    print('PASS ' + str(len(RESULTS)) + ' Sprint 01B native runtime checks', flush=True)


if __name__ == '__main__':
    setup() if '--setup' in sys.argv else main()
