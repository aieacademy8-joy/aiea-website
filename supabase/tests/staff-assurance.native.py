#!/usr/bin/env python3
"""SNV03 regression. Disposable LOCAL Supabase only; creates synthetic adults.

Set AIEA_LOCAL_CREDENTIALS to the private JSON output from local CLI start/status.
Needs local Docker/psql and the three Portal migrations. Never use a hosted stack.
No credentials, JWTs, or TOTP secrets are printed. All guard probes roll back.
"""
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import struct
import subprocess
import time
import urllib.error
import urllib.request
import uuid

C = json.loads(Path(os.environ['AIEA_LOCAL_CREDENTIALS']).read_text())
if C.get('API_URL') != 'http://127.0.0.1:54321':
    raise SystemExit('Only the disposable local API at 127.0.0.1:54321 is allowed')
RESULTS = []


def check(label, value):
    RESULTS.append({'label': label, 'pass': bool(value)})
    print(('PASS ' if value else 'FAIL ') + label, flush=True)
    if not value:
        raise AssertionError(label)


def request(path, token=None, method='GET', body=None, admin=False):
    headers = {'apikey': C['SECRET_KEY'] if admin else C['PUBLISHABLE_KEY']}
    if token or admin:
        headers['Authorization'] = 'Bearer ' + (C['SERVICE_ROLE_KEY'] if admin else token)
    if body is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(C['API_URL'] + path, method=method, headers=headers,
                                 data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, json.loads(res.read() or b'{}')
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read() or b'{}')


def claims(token):
    part = token.split('.')[1]
    return json.loads(base64.urlsafe_b64decode(part + '=' * (-len(part) % 4)))


def quote(value):
    return "'" + value.replace("'", "''") + "'"


def sql(statement):
    # A fixed local container prevents an environment DB_URL from selecting a host.
    res = subprocess.run(['docker', 'exec', '-i', 'supabase_db_aiea-portal-local',
                          'psql', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1',
                          '-U', 'postgres', '-d', 'postgres'], input=statement,
                         text=True, capture_output=True, check=False)
    if res.returncode:
        raise RuntimeError('Local SQL probe failed (details deliberately omitted)')
    return res.stdout


def context(claim, statement, before=''):
    return sql("begin;select set_config('request.jwt.claims'," +
               quote(json.dumps(claim)) + ',true);' + before + 'set local role service_role;' +
               statement + ';rollback;')


def totp(token, name):
    status, factor = request('/auth/v1/factors', token, 'POST',
                             {'factor_type': 'totp', 'friendly_name': name})
    if status != 200:
        raise AssertionError('Local TOTP enrollment failed')
    status, challenge = request('/auth/v1/factors/' + factor['id'] + '/challenge', token, 'POST', {})
    if status != 200:
        raise AssertionError('Local TOTP challenge failed')
    secret = factor['totp']['secret']
    key = base64.b32decode(secret + '=' * (-len(secret) % 8))
    digest = hmac.new(key, struct.pack('>Q', int(time.time()) // 30), hashlib.sha1).digest()
    offset = digest[-1] & 15
    code = str((struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7fffffff) % 1000000).zfill(6)
    status, session = request('/auth/v1/factors/' + factor['id'] + '/verify', token, 'POST',
                              {'challenge_id': challenge['id'], 'code': code})
    if status != 200:
        raise AssertionError('Local TOTP verification failed')
    return session['access_token'], factor['id']


def adult(name):
    email = 'snv03-' + name + '-' + uuid.uuid4().hex + '@example.invalid'
    status, user = request('/auth/v1/admin/users', method='POST', admin=True,
                           body={'email': email, 'email_confirm': True})
    if status != 200:
        raise AssertionError('Synthetic local adult creation failed')
    status, link = request('/auth/v1/admin/generate_link', method='POST', admin=True,
                           body={'type': 'magiclink', 'email': email})
    if status != 200:
        raise AssertionError('Synthetic local link generation failed')
    status, session = request('/auth/v1/verify', method='POST',
                              body={'type': 'magiclink', 'token_hash': link['hashed_token']})
    if status != 200:
        raise AssertionError('Synthetic local session verification failed')
    sql('insert into portal.user_profile(user_id,adult_confirmed_at) values (' + quote(user['id']) + ',now());')
    return user['id'], session['access_token']


def fresh_session(token):
    status, user = request('/auth/v1/user', token)
    if status != 200:
        raise AssertionError('Existing local adult validation failed')
    status, link = request('/auth/v1/admin/generate_link', method='POST', admin=True,
                           body={'type': 'magiclink', 'email': user['email']})
    if status != 200:
        raise AssertionError('Independent local session link failed')
    status, session = request('/auth/v1/verify', method='POST',
                              body={'type': 'magiclink', 'token_hash': link['hashed_token']})
    if status != 200:
        raise AssertionError('Independent local session verification failed')
    return session['access_token']


def probe(label, claim, allowed, before=''):
    result = context(claim, "select portal_private.staff_has('CURRICULUM_PUBLISH')", before)
    check(label + ': predicate', ('\nt\n' if allowed else '\nf\n') in '\n' + result + '\n')
    # Exercise each existing privileged call site, including the staff write gate.
    operations = {
        'retirement': "update portal.program_version set status='RETIRED' where id=" + quote(V1),
        'publication': "update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id=" + quote(V2),
        'staff management': 'insert into portal.staff_authorization(user_id,capabilities) values (' +
                            quote(OTHER) + ",array['SUPPORT_READ'])",
    }
    for operation, statement in operations.items():
        # PL/pgSQL subtransaction catches the precise authorization SQLSTATE.
        # A successful operation with an expected denial raises an uncaught error.
        if allowed:
            body = statement + ';'
        else:
            body = "begin " + statement + ";raise exception 'unexpected authorization';" + \
                   "exception when insufficient_privilege then null;end;"
        context(claim, 'do $probe$ begin ' + body + ' end $probe$', before)
        check(label + ': ' + operation, True)


STAFF, AAL1 = adult('staff')
OTHER, ORDINARY = adult('ordinary')
sql("begin;select set_config('request.jwt.claims'," + quote(json.dumps(claims(AAL1))) +
    ',true);insert into portal.staff_authorization(user_id,capabilities) values (' +
    quote(STAFF) + ",array['CURRICULUM_PUBLISH','STAFF_MANAGE']);commit;")
TOKEN, FACTOR = totp(AAL1, 'SNV03 first genuine factor')
ORDINARY2, OTHER_FACTOR = totp(ORDINARY, 'SNV03 ordinary genuine factor')
SID = claims(TOKEN)['session_id']
PROGRAM, V1, V2 = (str(uuid.uuid4()) for _ in range(3))
sql('begin;insert into portal.program(id,program_key) values (' + quote(PROGRAM) + ',' + quote('snv03-' + PROGRAM) + ');' +
    'insert into portal.program_version(id,program_id,version_key,default_locale) values (' +
    quote(V1) + ',' + quote(PROGRAM) + ",'v1','en-US'),(" + quote(V2) + ',' + quote(PROGRAM) + ",'v2','en-US');" +
    "insert into portal.program_version_locale(program_version_id,locale_code,title,status) values (" +
    quote(V1) + ",'en-US','Synthetic','PUBLISHED'),(" + quote(V2) + ",'en-US','Synthetic','PUBLISHED');" +
    "update portal.program_version set status='REVIEW_READY' where program_id=" + quote(PROGRAM) + ';commit;')
sql("begin;select set_config('request.jwt.claims'," + quote(json.dumps(claims(TOKEN))) +
    ",true);set local role service_role;update portal.program_version set status='PUBLISHED',content_hash=repeat('a',64) where id=" + quote(V1) + ';commit;')
check('genuine TOTP JWT and managed session have aal2 with matching verified factor',
      claims(TOKEN)['sub'] == STAFF and claims(TOKEN)['exp'] > time.time() and
      claims(TOKEN)['aal'] == 'aal2' and any(x.get('method') == 'totp' for x in claims(TOKEN)['amr']) and
      sql("select exists(select 1 from auth.sessions s join auth.mfa_factors f on f.id=s.factor_id and f.user_id=s.user_id where s.id=" +
          quote(SID) + " and s.aal='aal2' and f.id=" + quote(FACTOR) + " and f.status='verified' and f.factor_type='totp');").strip() == 't')
probe('current genuine staff', claims(TOKEN), True)
probe('ordinary genuine TOTP without staff grant', claims(ORDINARY2), False)
probe('old aal1 after session TOTP upgrade', claims(AAL1), False)
CURRENT_AAL1 = fresh_session(TOKEN)
check('separate current staff session is only managed aal1',
      claims(CURRENT_AAL1)['aal'] == 'aal1' and
      sql('select aal from auth.sessions where id=' + quote(claims(CURRENT_AAL1)['session_id']) + ';').strip() == 'aal1')
probe('current staff session with only aal1', claims(CURRENT_AAL1), False)
probe('inactive adult profile', claims(TOKEN), False,
      "update portal.user_profile set status='INACTIVE' where user_id=" + quote(STAFF) + ';')
probe('missing adult profile', claims(TOKEN), False,
      'delete from portal.user_profile where user_id=' + quote(STAFF) + ';')
probe('revoked staff authorization', claims(TOKEN), False,
      "update portal.staff_authorization set status='REVOKED' where user_id=" + quote(STAFF) + ';')
probe('managed session expiry', claims(TOKEN), False,
      "update auth.sessions set not_after=statement_timestamp()-interval '1 second' where id=" + quote(SID) + ';')
probe('managed session downgrade', claims(TOKEN), False,
      "update auth.sessions set aal='aal1' where id=" + quote(SID) + ';')
probe('unverified bound factor', claims(TOKEN), False,
      "update auth.mfa_factors set status='unverified' where id=" + quote(FACTOR) + ';')
probe('another adult factor cannot satisfy staff session', claims(TOKEN), False,
      'update auth.sessions set factor_id=' + quote(OTHER_FACTOR) + ' where id=' + quote(SID) + ';')
probe('another factor type cannot satisfy staff session', claims(TOKEN), False,
      "update auth.mfa_factors set factor_type='phone',phone='+15555550101' where id=" + quote(FACTOR) + ';')
for label, sid in [('missing', None), ('null', None), ('malformed', 'bad-uuid'),
                   ('object', {'id': SID}), ('other adult', claims(ORDINARY2)['session_id'])]:
    claim = claims(TOKEN)
    if label == 'missing':
        claim.pop('session_id')
    else:
        claim['session_id'] = sid
    probe('SQL context ' + label + ' session ID', claim, False)

status, response = request('/auth/v1/factors/' + FACTOR, TOKEN, 'DELETE')
check('genuine first factor removal succeeds', status == 200)
check('first factor removal downgrades current managed session to aal1',
      sql('select aal from auth.sessions where id=' + quote(SID) + ';').strip() == 'aal1')
status, response = request('/auth/v1/user', TOKEN)
check('old aal2 JWT still accepted by native Auth after first factor removal', status == 200)
probe('old aal2 after genuine first factor removal', claims(TOKEN), False)

FRESH, FACTOR2 = totp(fresh_session(TOKEN), 'SNV03 independent fresh factor')
SID2 = claims(FRESH)['session_id']
check('fresh independent verified factor restores current managed aal2',
      FACTOR != FACTOR2 and SID2 != SID and
      sql('select aal from auth.sessions where id=' + quote(SID2) + ';').strip() == 'aal2')
probe('fresh genuine staff assurance', claims(FRESH), True)
probe('removed-factor session stays denied while another session has genuine aal2', claims(TOKEN), False)
SID = SID2
status, response = request('/auth/v1/factors/' + FACTOR2, FRESH, 'DELETE')
check('fresh independent factor removal succeeds', status == 200)
check('no verified TOTP remains after independent removal',
      sql('select count(*) from auth.mfa_factors where user_id=' + quote(STAFF) +
          " and status='verified' and factor_type='totp';").strip() == '0')
check('independent factor removal downgrades its managed session to aal1',
      sql('select aal from auth.sessions where id=' + quote(SID) + ';').strip() == 'aal1')
status, response = request('/auth/v1/user', FRESH)
check('independent unexpired old aal2 JWT remains accepted by native Auth',
      status == 200 and claims(FRESH)['exp'] > time.time())
probe('old aal2 after independent factor removal', claims(FRESH), False)

FINAL, FACTOR3 = totp(FRESH, 'SNV03 session termination factor')
status, response = request('/auth/v1/logout?scope=local', FINAL, 'POST', {})
check('native local signout succeeds', status == 204)
check('native signout removes current managed session',
      sql('select count(*) from auth.sessions where id=' + quote(SID) + ';').strip() == '0')
probe('old aal2 after native session termination', claims(FINAL), False)
print('PASS ' + str(len(RESULTS)) + ' SNV03 checks; all privileged probes rolled back', flush=True)
