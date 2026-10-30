#!/usr/bin/env python3
"""LOCAL TEST DATA only: provision/check a disposable native Supabase pilot.

The DB PUBLISHED state exercises delivery guards in this isolated test database;
it is not an AIEA curriculum approval or release. No candidate content is imported.
Operator credentials are read privately and never enter the Portal application.
"""
import base64
import hashlib
import hmac
import http.client
import io
import json
from pathlib import Path
import struct
import socket
import subprocess
import sys
import tarfile
import time
import urllib.error
import urllib.request
import urllib.parse
import uuid

CONTAINER = 'supabase_db_aiea-portal-native-pilot'
ROOT = Path(__file__).resolve().parents[2]
PREFIX = 'feed0000-0000-4000-8000-'
W, S, L, CO, P, V, R, OTHER = [PREFIX + str(n).zfill(12) for n in range(1, 9)]
MISSIONS = [PREFIX + str(100 + n).zfill(12) for n in range(1, 9)]
RESULTS = []


def check(label, condition):
    RESULTS.append({'label': label, 'pass': bool(condition)})
    print(('PASS ' if condition else 'FAIL ') + label, flush=True)
    if not condition:
        raise SystemExit('Native local pilot check failed: ' + label)


def quote(value):
    return "'" + value.replace("'", "''") + "'"


def sql(statement, operator=False):
    result = subprocess.run(['docker', 'exec', '-i', CONTAINER, 'psql', '-X', '-qAt',
                             '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin' if operator else 'postgres', '-d', 'postgres'],
                            input=statement, text=True, capture_output=True)
    if result.returncode:
        error_file = CREDS.parent / 'native-sql-error.log'
        error_file.write_text(result.stderr); error_file.chmod(0o600)
        raise SystemExit('Isolated pilot SQL operation failed; private provider details omitted')
    return result.stdout.strip()


def request(path, body=None, token=None, admin=False, method=None):
    headers = {'apikey': C['SECRET_KEY'] if admin else C['PUBLISHABLE_KEY']}
    if admin:
        token = C['SERVICE_ROLE_KEY']
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if path.startswith('/rest/'):
        headers.update({'Accept-Profile': 'portal', 'Content-Profile': 'portal'})
    if body is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(C['API_URL'] + path, headers=headers, method=method,
                                 data=None if body is None else json.dumps(body).encode())
    try:
        response = urllib.request.urlopen(req, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    except urllib.error.URLError:
        raise SystemExit('Isolated local API unavailable; check native service readiness') from None
    raw = response.read()
    try:
        data = json.loads(raw)
    except ValueError:
        data = None
    return response.status, data


def claims(token):
    part = token.split('.')[1]
    return json.loads(base64.urlsafe_b64decode(part + '=' * (-len(part) % 4)))


def claim_sql(token):
    # Controlled LOCAL operator seeding only, using claims from genuine native
    # issuance. Application writes always forward the JWT to the approved RPCs.
    return "select set_config('request.jwt.claims'," + quote(json.dumps(claims(token))) + ',true);'


def session(email):
    status, link = request('/auth/v1/admin/generate_link', {'type': 'magiclink', 'email': email}, admin=True)
    check('LOCAL operator test-session link generated', status == 200)
    status, value = request('/auth/v1/verify', {'type': 'magiclink', 'token_hash': link['hashed_token']})
    check('genuine native test-session issuance', status == 200 and bool(value.get('access_token')))
    return value


def provision():
    if STATE.exists() or sql('select count(*) from portal.user_profile;') != '0':
        raise SystemExit('Provision only an empty isolated pilot; existing data is preserved')
    users = {}
    for role in ['adult', 'publisher', 'outsider']:
        email = 'aiea-local-test-' + role + '-' + uuid.uuid4().hex[:8] + '@example.invalid'
        status, user = request('/auth/v1/admin/users', {'email': email, 'email_confirm': True}, admin=True)
        check('pre-existing LOCAL TEST adult account: ' + role, status == 200 and user.get('is_anonymous') is False)
        users[role] = {'id': user['id'], 'email': email}
        sql('insert into portal.user_profile(user_id,adult_confirmed_at) values (' + quote(user['id']) + ',now());')
    adult = session(users['adult']['email'])
    publisher = session(users['publisher']['email'])
    token = publisher['access_token']
    status, factor = request('/auth/v1/factors', {'factor_type': 'totp', 'friendly_name': 'LOCAL TEST publication guard'}, token)
    check('native publisher TOTP enrollment', status == 200)
    status, challenge = request('/auth/v1/factors/' + factor['id'] + '/challenge', {}, token)
    check('native publisher TOTP challenge', status == 200)
    secret = factor['totp']['secret']
    key = base64.b32decode(secret + '=' * (-len(secret) % 8))
    digest = hmac.new(key, struct.pack('>Q', int(time.time()) // 30), hashlib.sha1).digest()
    offset = digest[-1] & 15
    code = str((struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7fffffff) % 1000000).zfill(6)
    status, publisher = request('/auth/v1/factors/' + factor['id'] + '/verify', {'challenge_id': challenge['id'], 'code': code}, token)
    check('native publisher TOTP verification', status == 200 and claims(publisher['access_token'])['aal'] == 'aal2')
    token = publisher['access_token']
    sql('begin;' + claim_sql(token) + 'insert into portal.staff_authorization(user_id,capabilities) values (' +
        quote(users['publisher']['id']) + ",array['CURRICULUM_PUBLISH']);commit;")
    statements = ['begin;', claim_sql(adult['access_token'])]
    for workspace, kind, name, role in [(W, 'FAMILY', 'LOCAL TEST FAMILY', 'OWNER'), (S, 'SCHOOL', 'LOCAL TEST SCHOOL', 'SCHOOL_ADMIN')]:
        statements.append('insert into portal.workspace(id,kind,display_name) values (' + quote(workspace) + ',' + quote(kind) + ',' + quote(name) + ');')
        statements.append('insert into portal.workspace_membership(workspace_id,workspace_kind,user_id,role) values (' +
                          quote(workspace) + ',' + quote(kind) + ',' + quote(users['adult']['id']) + ',' + quote(role) + ');')
    statements += ["insert into portal.learner_ref(id,workspace_id,display_code) values ('" + L + "','" + W + "','LOCAL-TEST-LEARNER');",
                   "insert into portal.cohort(id,workspace_id,display_code) values ('" + CO + "','" + S + "','LOCAL-TEST-COHORT');",
                   "insert into portal.workspace(id,kind,display_name) values ('" + OTHER + "','FAMILY','LOCAL TEST UNAUTHORIZED');", 'commit;']
    sql('\n'.join(statements))
    resource_dir = CREDS.parent / 'resources'
    resource_dir.mkdir(mode=0o700)
    resource_bytes = b'LOCAL TEST DATA\nTechnical download validation only. Not approved AIEA curriculum.\n'
    resource_path = 'local-test/' + V + '/local-test-resource.txt'
    resource_file = resource_dir / resource_path
    resource_file.parent.mkdir(parents=True, mode=0o700)
    resource_file.write_bytes(resource_bytes)
    resource_hash = hashlib.sha256(resource_bytes).hexdigest()
    manifest = {'label': 'LOCAL TEST DATA', 'program': P, 'version': V, 'missions': MISSIONS, 'resource_hash': resource_hash}
    content_hash = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()
    statements = ['begin;', claim_sql(token), "insert into portal.program(id,program_key) values ('" + P + "','local-test-data-only');",
                  "insert into portal.program_version(id,program_id,version_key,default_locale,fallback_locale,completion_rules) values ('" + V + "','" + P + "','LOCAL-TEST-v1','en-US','en-US','{\"method\":\"ADULT_ATTESTATION\"}');",
                  "insert into portal.program_version_locale(program_version_id,locale_code,title,description,guidance,status) values ('" + V + "','en-US','LOCAL TEST DATA — eight-mission technical journey','Technical validation only. Not approved AIEA curriculum.','LOCAL TEST DATA only.','PUBLISHED');"]
    for sequence, mission in enumerate(MISSIONS, 1):
        statements.append("insert into portal.mission(id,program_version_id,mission_key,sequence,completion_rules,evidence_expectations) values ('" + mission + "','" + V + "','local-test-" + str(sequence) + "'," + str(sequence) + ",' {\"method\":\"ADULT_ATTESTATION\"}','{\"required\":false}');")
        statements.append("insert into portal.mission_locale(mission_id,program_version_id,locale_code,title,instructions,reflection,status) values ('" + mission + "','" + V + "','en-US','LOCAL TEST Mission " + str(sequence) + "','LOCAL TEST DATA. Technical lesson rendering check " + str(sequence) + ". Not approved AIEA curriculum.','Technical validation only.','PUBLISHED');")
    statements += ["insert into portal.resource_asset(id,program_version_id,asset_key,locale_neutral,blob_path,content_hash) values ('" + R + "','" + V + "','LOCAL TEST resource',true," + quote(resource_path) + ",'" + resource_hash + "');",
                   "update portal.program_version set status='REVIEW_READY' where id='" + V + "';",
                   "update portal.program_version set status='PUBLISHED',content_hash='" + content_hash + "' where id='" + V + "';", 'commit;']
    sql('\n'.join(statements))
    # The isolated paid-test billing basis exercises existing exact entitlement
    # constraints. It does not claim a Stripe charge or change hosted commerce.
    statements = ['begin;', claim_sql(adult['access_token'])]
    for n, workspace in enumerate([W, S], 20):
        billing = PREFIX + str(n).zfill(12)
        statements.append("insert into portal.billing_reference(id,workspace_id,program_version_id,initiating_user_id,offering_key,environment,idempotency_key,stripe_account_id,stripe_product_id,stripe_price_id,status) values ('" + billing + "','" + workspace + "','" + V + "','" + users['adult']['id'] + "','local-test-only','test','local-test-" + str(n) + "','acct_local_test','prod_local_test','price_local_test','PAID');")
        statements.append("insert into portal.entitlement(workspace_id,program_version_id,billing_reference_id,status) values ('" + workspace + "','" + V + "','" + billing + "','ACTIVE');")
    statements.append('commit;')
    sql('\n'.join(statements))
    state = {**manifest, 'users': users, 'family': W, 'school': S, 'learner': L, 'cohort': CO, 'unauthorized_workspace': OTHER, 'resource': R, 'resource_path': resource_path}
    STATE.write_text(json.dumps(state, indent=2)); STATE.chmod(0o600)
    check('isolated LOCAL TEST DATA seeded through accepted publication and entitlement guards', sql('select count(*) from portal.mission;') == '8')
    print('No curriculum candidate imported; no child Auth account created.', flush=True)


def native_checks():
    state = json.loads(STATE.read_text())
    expected = [p.name.split('_')[0] for p in sorted((ROOT / 'supabase/migrations').glob('*.sql'))]
    check('exact five migration history entries in dependency order', sql('select version from supabase_migrations.schema_migrations order by version;').splitlines() == expected)
    status, settings = request('/auth/v1/settings')
    check('native email enabled; public signup and anonymous Auth disabled', status == 200 and settings['external']['email'] and settings['disable_signup'] and not settings['external']['anonymous_users'])
    for body in [{'email': 'unknown-' + uuid.uuid4().hex + '@example.invalid', 'password': uuid.uuid4().hex}, {'data': {}}]:
        status, data = request('/auth/v1/signup', body)
        check('native unknown/anonymous signup denied', status in [400, 401, 403, 422] and 'access_token' not in data)
    check('registry RLS enabled and forced', sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='portal_private.write_session_generation'::regclass;") == 't')
    check('browser/service cannot invoke hook or edit registry', sql("select bool_and(not has_function_privilege(r,'portal_private.issue_write_generation(jsonb)','EXECUTE') and not has_table_privilege(r,'portal_private.write_session_generation','INSERT,UPDATE,DELETE') and not has_sequence_privilege(r,'portal_private.write_generation_seq','USAGE,UPDATE')) from unnest(array['anon','authenticated','service_role']) r;") == 't')
    check('Auth issuer cannot rebind identity, delete registry or reset allocator', sql("select not has_column_privilege('supabase_auth_admin','portal_private.write_session_generation','session_id','UPDATE') and not has_column_privilege('supabase_auth_admin','portal_private.write_session_generation','user_id','UPDATE') and not has_table_privilege('supabase_auth_admin','portal_private.write_session_generation','DELETE,TRUNCATE') and not has_sequence_privilege('supabase_auth_admin','portal_private.write_generation_seq','UPDATE');") == 't')
    check('only ordinary authenticated role has bounded write RPC execution', sql("select has_function_privilege('authenticated','portal.record_mission_progress(uuid,uuid,uuid,uuid,text)','EXECUTE') and not has_function_privilege('service_role','portal.record_mission_progress(uuid,uuid,uuid,uuid,text)','EXECUTE') and not has_function_privilege('anon','portal.record_mission_progress(uuid,uuid,uuid,uuid,text)','EXECUTE');") == 't')
    check('Auth hook is a fixed-search-path security invoker', sql("select not prosecdef and proconfig=array['search_path=\"\"'] from pg_proc where oid='portal_private.issue_write_generation(jsonb)'::regprocedure;") == 't')
    source = (ROOT / 'supabase/migrations/20261008000200_portal_write_generation.sql').read_text()
    for signature, declaration in [('portal_private.issue_write_generation(jsonb)', 'create function portal_private.issue_write_generation(event jsonb)'),
                                   ('portal_private.assert_write_session()', 'create or replace function portal_private.assert_write_session()')]:
        body = source.split(declaration, 1)[1].split('$$')[1]
        check('native function body matches accepted migration: ' + signature,
              sql('select md5(prosrc) from pg_proc where oid=' + quote(signature) + '::regprocedure;') == hashlib.md5(body.encode()).hexdigest())
    for attempt in range(3):
        time.sleep(1.01 - time.time() % 1)
        old = session(state['users']['adult']['email'])
        status, current = request('/auth/v1/token?grant_type=refresh_token', {'refresh_token': old['refresh_token']})
        check('genuine native refresh succeeds', status == 200)
        old_claim, new_claim = claims(old['access_token']), claims(current['access_token'])
        if old_claim['iat'] == new_claim['iat']:
            break
    check('HR03 genuinely issued same-epoch-second token pair', old_claim['iat'] == new_claim['iat'])
    check('HR03 signed generation advances on same native session', old_claim['session_id'] == new_claim['session_id'] and int(new_claim['aiea_write_generation']) > int(old_claim['aiea_write_generation']))
    check('HR03 exact signed claim matches private live registry', sql("select user_id::text||'/'||generation::text from portal_private.write_session_generation where session_id=" + quote(new_claim['session_id']) + ';') == new_claim['sub'] + '/' + new_claim['aiea_write_generation'])
    # Prove obsolete-token denial through each exposed RPC, with zero mutation.
    before = sql('select (select count(*) from portal.mission_progress)||\'/\'||(select count(*) from portal.cohort_mission_delivery)||\'/\'||(select count(*) from portal.audit_event);')
    for school in [False, True]:
        body = {'workspace_id': S if school else W, 'program_version_id': V, 'mission_id': MISSIONS[0],
                'cohort_id' if school else 'learner_ref_id': CO if school else L, 'action': 'start'}
        status, data = request('/rest/v1/rpc/' + ('record_cohort_delivery' if school else 'record_mission_progress'), body, old['access_token'])
        check('HR03 obsolete token denied at ' + ('SCHOOL' if school else 'FAMILY') + ' RPC', status == 403)
        body['action'] = 'deliver' if school else 'complete'
        status, _ = request('/rest/v1/rpc/' + ('record_cohort_delivery' if school else 'record_mission_progress'), body, current['access_token'])
        check('terminal action cannot skip explicit start: ' + ('SCHOOL' if school else 'FAMILY'), status == 400)
    after = sql('select (select count(*) from portal.mission_progress)||\'/\'||(select count(*) from portal.cohort_mission_delivery)||\'/\'||(select count(*) from portal.audit_event);')
    check('obsolete native writes create no progress/delivery/audit mutation', before == after)
    outsider = session(state['users']['outsider']['email'])
    status, rows = request('/rest/v1/workspace?select=id', token=outsider['access_token'])
    check('native RLS denies unaffiliated workspace visibility', status == 200 and rows == [])
    status, _ = request('/rest/v1/mission_progress', {'workspace_id': W, 'program_version_id': V, 'mission_id': MISSIONS[0], 'learner_ref_id': L, 'status': 'COMPLETED'}, current['access_token'])
    check('ordinary native direct table writes denied', status in [401, 403])
    status, _ = request('/auth/v1/logout?scope=local', token=current['access_token'], method='POST')
    check('native local logout succeeds', status == 204)
    check('native logout removes HR03 session authority', sql('select count(*) from portal_private.write_session_generation where session_id=' + quote(new_claim['session_id']) + ';') == '0')
    status, _ = request('/rest/v1/rpc/record_mission_progress', {'workspace_id': W, 'program_version_id': V, 'mission_id': MISSIONS[0], 'learner_ref_id': L, 'action': 'start'}, current['access_token'])
    check('logged-out bearer cannot authorize progress recording', status == 403)
    check('HR01 exact attestation/no-evidence test vocabulary preserved', sql("select bool_and(completion_rules='{\"method\":\"ADULT_ATTESTATION\"}'::jsonb and evidence_expectations='{\"required\":false}'::jsonb) from portal.mission;") == 't')


def sql_regression():
    if sql('select count(*) from portal.user_profile;') != '0':
        raise SystemExit('Run transactional foundation checks before provisioning the pilot')
    foundation = (ROOT / 'supabase/tests/foundation.sql').read_text()
    def inventory(statement, expected_file, label):
        output = sql(statement)
        actual = [line[5:] for line in output.splitlines() if line.startswith('PASS ')]
        expected = json.loads((ROOT / 'supabase/tests' / expected_file).read_text())
        check(label + ': exact ' + str(len(expected)) + ' assertions on native PostgreSQL',
              len(actual) == len(set(actual)) and sorted(actual) == sorted(expected))
    inventory(foundation, 'assertions.json', 'accepted foundation')
    # Same test-only fixture adaptation as the existing offline regression.
    # Every row rolls back; accepted source/migrations remain unchanged.
    setup = foundation.split("select pg_temp.ok((select count(*)=28")[0]
    setup = setup.replace("update portal.program_version set status='PUBLISHED',content_hash=repeat('a',64);",
                          "update portal.program_version set completion_rules='{\"method\":\"ADULT_ATTESTATION\"}' where id='40000000-0000-0000-0000-000000000001';"
                          "update portal.mission set completion_rules='{\"method\":\"ADULT_ATTESTATION\"}',evidence_expectations='{\"required\":false}' where id='50000000-0000-0000-0000-000000000001';"
                          "update portal.program_version set status='PUBLISHED',content_hash=repeat('a',64);")
    generation = (ROOT / 'supabase/tests/write-generation.sql').read_text()
    status = (ROOT / 'supabase/tests/mission-status.sql').read_text()
    output = sql(setup + "\nselect 'AIEA_NATIVE_STATUS_BEGIN';\n" + generation + status, operator=True)
    output = output.split('AIEA_NATIVE_STATUS_BEGIN\n', 1)[1]
    actual = [line[5:] for line in output.splitlines() if line.startswith('PASS ')]
    expected = json.loads((ROOT / 'supabase/tests/write-generation.assertions.json').read_text()) + json.loads((ROOT / 'supabase/tests/mission-status.assertions.json').read_text())
    check('native HR03/status SQL: exact ' + str(len(expected)) + ' transactional assertions',
          len(actual) == len(set(actual)) and sorted(actual) == sorted(expected))
    check('native regression leaves no profile/curriculum/status fixtures behind',
          sql('select (select count(*) from portal.user_profile)+(select count(*) from portal.program)+(select count(*) from portal.mission_progress)+(select count(*) from portal.cohort_mission_delivery);') == '0')


def bind_loopback():
    # CLI 2.120 explicitly binds all interfaces, overriding network defaults.
    # Recreate only this pilot's exposed containers with identical configuration,
    # named volumes and network aliases. No volume/schema/auth change occurs.
    host = json.loads(subprocess.check_output(['docker', 'context', 'inspect']))[0]['Endpoints']['docker']['Host']
    if not host.startswith('unix://'):
        raise SystemExit('Local Unix Docker daemon required')
    class DockerConnection(http.client.HTTPConnection):
        def connect(self):
            self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            self.sock.connect(host.removeprefix('unix://'))
    def docker(method, endpoint, body=None, archive=False):
        connection = DockerConnection('localhost', timeout=30)
        connection.request(method, '/v1.52' + endpoint,
                           body=body if archive else None if body is None else json.dumps(body),
                           headers={'Content-Type': 'application/x-tar' if archive else 'application/json'})
        response = connection.getresponse(); raw = response.read(); connection.close()
        if response.status not in [200, 201, 204, 304]:
            raise SystemExit('Local Docker binding operation failed: ' + method + ' ' + endpoint + ' HTTP ' + str(response.status) + '; private configuration omitted')
        return raw if archive else json.loads(raw) if raw else None
    for service in ['inbucket', 'kong', 'db']:
        name = 'supabase_' + service + '_aiea-portal-native-pilot'
        current = docker('GET', '/containers/' + name + '/json')
        bindings = current['HostConfig']['PortBindings']
        if all(item['HostIp'] == '127.0.0.1' for items in bindings.values() for item in items):
            continue
        if not current['Mounts'] and service == 'db':
            raise SystemExit('Refuse to recreate a database without preserved mounts')
        for items in bindings.values():
            for item in items:
                item['HostIp'] = '127.0.0.1'
        config = {**current['Config'], 'HostConfig': current['HostConfig']}
        endpoints = {}
        for network, details in current['NetworkSettings']['Networks'].items():
            endpoints[network] = {'Aliases': [alias for alias in details.get('Aliases', []) if alias != current['Id'] and alias != current['Id'][:12]]}
        config['NetworkingConfig'] = {'EndpointsConfig': endpoints}
        # The CLI copies gateway configuration/certificates into the writable
        # container layer, outside mounts. Preserve them privately in memory.
        gateway_files = None
        if service == 'kong':
            raw = docker('GET', '/containers/' + name + '/archive?path=/home/kong', archive=True)
            # Do not overwrite the separately bind-mounted email template.
            output = io.BytesIO()
            with tarfile.open(fileobj=io.BytesIO(raw)) as source, tarfile.open(fileobj=output, mode='w') as archive:
                for member in source.getmembers():
                    if member.isfile() and not member.name.startswith('kong/templates/'):
                        archive.addfile(member, source.extractfile(member))
            gateway_files = output.getvalue()
            recovery = CREDS.parent / 'gateway-recovery.tar'
            recovery.write_bytes(gateway_files); recovery.chmod(0o600)
        docker('POST', '/containers/' + name + '/stop?t=10')
        docker('DELETE', '/containers/' + name)  # No volume deletion flag.
        created = docker('POST', '/containers/create?name=' + urllib.parse.quote(name), config)
        if gateway_files is not None:
            docker('PUT', '/containers/' + created['Id'] + '/archive?path=/home', gateway_files, archive=True)
        docker('POST', '/containers/' + created['Id'] + '/start')
        check('native service restricted to loopback, mounts retained: ' + service, True)
    for service in ['inbucket', 'kong', 'db']:
        current = docker('GET', '/containers/supabase_' + service + '_aiea-portal-native-pilot/json')
        check('verified loopback port bindings: ' + service,
              current['State']['Running'] and all(item['HostIp'] == '127.0.0.1' for items in current['HostConfig']['PortBindings'].values() for item in items))


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ['provision', 'check', 'sql-regression', 'bind-loopback']:
        raise SystemExit('Usage: native-local-pilot.py provision|check|sql-regression|bind-loopback <private-local-status.json>')
    CREDS = Path(sys.argv[2]).resolve(); C = json.loads(CREDS.read_text())
    if C.get('API_URL') != 'http://127.0.0.1:54321' or not C.get('PUBLISHABLE_KEY', '').startswith('sb_publishable_'):
        raise SystemExit('Explicit loopback native credentials required')
    marker = json.loads((CREDS.parent / 'project/pilot.json').read_text())
    if marker.get('projectId') != 'aiea-portal-native-pilot':
        raise SystemExit('Isolated native project marker required')
    STATE = CREDS.parent / 'pilot-state.json'
    try:
        {'provision': provision, 'check': native_checks, 'sql-regression': sql_regression, 'bind-loopback': bind_loopback}[sys.argv[1]]()
    finally:
        (CREDS.parent / ('native-' + sys.argv[1] + '-results.json')).write_text(json.dumps(RESULTS, indent=2))
