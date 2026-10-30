#!/usr/bin/env python3
"""Additive LOCAL TEST DATA for variable mission counts, never a lesson import.

Every entitled test version is fully authorized under the frozen contract. These
records do not implement or claim first-N access to a larger curriculum version.
"""
import importlib.util
import json
import hashlib
import base64
import hmac
import struct
import time
import sys
import uuid
from pathlib import Path

spec = importlib.util.spec_from_file_location('pilot', Path(__file__).with_name('native-local-pilot.py'))
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)
q, sql, request, check = pilot.quote, pilot.sql, pilot.request, pilot.check


def preserved_digest(version):
    parts = []
    for table, key in [('program_version', 'id'), ('program_version_locale', 'program_version_id'),
                       ('mission', 'program_version_id'), ('mission_locale', 'program_version_id'),
                       ('resource_asset', 'program_version_id'), ('mission_progress', 'program_version_id'),
                       ('cohort_mission_delivery', 'program_version_id')]:
        parts.append(sql('select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),\'[]\'::jsonb) from portal.' +
                         table + ' t where ' + key + '=' + q(version) + ';'))
    return hashlib.sha256('\n'.join(parts).encode()).hexdigest()


def prepare():
    if STATE.exists():
        check('existing LOCAL TEST DATA retained; no reset or reseed', True)
        return
    original = json.loads(pilot.STATE.read_text())
    digest = preserved_digest(original['version'])
    users = {}
    for role in ['adult', 'publisher']:
        email = 'aiea-local-test-sequence-' + role + '-' + uuid.uuid4().hex[:8] + '@example.invalid'
        status, user = request('/auth/v1/admin/users', {'email': email, 'email_confirm': True}, admin=True)
        check('pre-existing LOCAL TEST adult account: ' + role, status == 200 and user.get('is_anonymous') is False)
        users[role] = {'id': user['id'], 'email': email}
        sql('insert into portal.user_profile(user_id,adult_confirmed_at) values (' + q(user['id']) + ',now());')
    adult, publisher = pilot.session(users['adult']['email']), pilot.session(users['publisher']['email'])
    token = publisher['access_token']
    status, factor = request('/auth/v1/factors', {'factor_type': 'totp', 'friendly_name': 'LOCAL TEST sequence publication'}, token)
    check('native publisher TOTP enrollment', status == 200)
    status, challenge = request('/auth/v1/factors/' + factor['id'] + '/challenge', {}, token)
    check('native publisher TOTP challenge', status == 200)
    secret = factor['totp']['secret']
    digest_bytes = hmac.new(base64.b32decode(secret + '=' * (-len(secret) % 8)),
                            struct.pack('>Q', int(time.time()) // 30), hashlib.sha1).digest()
    offset = digest_bytes[-1] & 15
    code = str((struct.unpack('>I', digest_bytes[offset:offset + 4])[0] & 0x7fffffff) % 1000000).zfill(6)
    status, publisher = request('/auth/v1/factors/' + factor['id'] + '/verify', {'challenge_id': challenge['id'], 'code': code}, token)
    check('genuine AAL2 publisher; publication guard retained', status == 200 and pilot.claims(publisher['access_token'])['aal'] == 'aal2')
    token = publisher['access_token']
    sql('begin;' + pilot.claim_sql(token) + 'insert into portal.staff_authorization(user_id,capabilities) values (' +
        q(users['publisher']['id']) + ",array['CURRICULUM_PUBLISH']);commit;")
    fresh = lambda: str(uuid.uuid4())
    family, school, learner, cohort, program = [fresh() for _ in range(5)]
    statements = ['begin;', pilot.claim_sql(adult['access_token'])]
    for workspace, kind in [(family, 'FAMILY'), (school, 'SCHOOL')]:
        statements += ['insert into portal.workspace(id,kind,display_name) values (' + q(workspace) + ',' + q(kind) + ',' + q('LOCAL TEST DYNAMIC ' + kind) + ');',
                       'insert into portal.workspace_membership(workspace_id,workspace_kind,user_id,role) values (' + q(workspace) + ',' + q(kind) + ',' +
                       q(users['adult']['id']) + ',' + q('OWNER' if kind == 'FAMILY' else 'SCHOOL_ADMIN') + ');']
    statements += ['insert into portal.learner_ref(id,workspace_id,display_code) values (' + q(learner) + ',' + q(family) + ",'LOCAL-TEST-DYNAMIC-LEARNER');",
                   'insert into portal.cohort(id,workspace_id,display_code) values (' + q(cohort) + ',' + q(school) + ",'LOCAL-TEST-DYNAMIC-COHORT');", 'commit;']
    sql('\n'.join(statements))
    versions = []
    statements = ['begin;', pilot.claim_sql(token), 'insert into portal.program(id,program_key) values (' + q(program) + ',' + q('local-test-dynamic-' + program) + ');']
    for count in [4, 5, 36, 6]:
        version, resource = fresh(), fresh()
        missions = [fresh() for _ in range(count)]
        title = 'LOCAL TEST DATA — ' + str(count) + '-mission sequence'
        versions.append({'id': version, 'count': count, 'missions': missions, 'title': title, 'resource': resource, 'authorized': count != 6})
        statements += ['insert into portal.program_version(id,program_id,version_key,default_locale,fallback_locale,completion_rules) values (' + q(version) + ',' + q(program) + ',' +
                       q('LOCAL-TEST-' + str(count)) + ",'en-US','en-US','{\"method\":\"ADULT_ATTESTATION\"}');",
                       'insert into portal.program_version_locale(program_version_id,locale_code,title,description,guidance,status) values (' + q(version) + ",'en-US'," + q(title) +
                       ",'LOCAL TEST DATA only. Not approved AIEA curriculum.','Whole-version technical validation; not commercial pilot lesson scoping.','PUBLISHED');"]
        for index, mission in enumerate(missions, 1):
            statements += ['insert into portal.mission(id,program_version_id,mission_key,sequence,completion_rules,evidence_expectations) values (' + q(mission) + ',' + q(version) + ',' +
                           q('local-test-mission-' + str(index)) + ',' + str(index) + ",' {\"method\":\"ADULT_ATTESTATION\"}','{\"required\":false}');",
                           'insert into portal.mission_locale(mission_id,program_version_id,locale_code,title,instructions,reflection,status) values (' + q(mission) + ',' + q(version) + ",'en-US'," +
                           q('LOCAL TEST Mission ' + str(index)) + ",'LOCAL TEST DATA. Technical rendering only. Not an approved AIEA lesson.','Technical validation only.','PUBLISHED');"]
        content_hash = hashlib.sha256(json.dumps({'label': 'LOCAL TEST DATA', 'version': version, 'missions': missions}, sort_keys=True).encode()).hexdigest()
        statements += ['insert into portal.resource_asset(id,program_version_id,asset_key,locale_neutral,blob_path,content_hash) values (' + q(resource) + ',' + q(version) +
                       ",'LOCAL TEST resource',true," + q(original['resource_path']) + ',' + q(original['resource_hash']) + ');',
                       "update portal.program_version set status='REVIEW_READY' where id=" + q(version) + ';',
                       "update portal.program_version set status='PUBLISHED',content_hash=" + q(content_hash) + ' where id=' + q(version) + ';']
    statements.append('commit;')
    sql('\n'.join(statements))
    statements = ['begin;', pilot.claim_sql(adult['access_token'])]
    for version in versions:
        if not version['authorized']:
            continue
        for workspace in [family, school]:
            billing = fresh()
            statements += ['insert into portal.billing_reference(id,workspace_id,program_version_id,initiating_user_id,offering_key,environment,idempotency_key,stripe_account_id,stripe_product_id,stripe_price_id,status) values (' +
                           ','.join(q(v) for v in [billing, workspace, version['id'], users['adult']['id'], 'local-test-dynamic-only', 'test', 'local-test-' + billing,
                                                  'acct_local_test', 'prod_local_test', 'price_local_test', 'PAID']) + ');',
                           'insert into portal.entitlement(workspace_id,program_version_id,billing_reference_id,status) values (' + q(workspace) + ',' + q(version['id']) + ',' + q(billing) + ",'ACTIVE');"]
    statements.append('commit;')
    sql('\n'.join(statements))
    state = {'label': 'LOCAL TEST DATA — mission contract, not canonical lessons or limited pilot access', 'users': users,
             'family': family, 'school': school, 'learner': learner, 'cohort': cohort, 'versions': versions,
             'original_version': original['version'], 'original_digest': digest, 'resource_hash': original['resource_hash']}
    STATE.write_text(json.dumps(state, indent=2)); STATE.chmod(0o600)
    check('4, 5 and 36-item versions published through accepted guards; 6-item version unentitled', True)
    check('existing eight-mission records and curriculum unchanged', preserved_digest(original['version']) == digest)


def validate():
    state = json.loads(STATE.read_text())
    check('existing eight-mission identities, content and persisted history unchanged', preserved_digest(state['original_version']) == state['original_digest'])
    check('HR03 registry retains forced RLS', sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='portal_private.write_session_generation'::regclass;") == 't')
    check('HR03 hook remains security invoker with fixed search path', sql("select not prosecdef and proconfig=array['search_path=\"\"'] from pg_proc where oid='portal_private.issue_write_generation(jsonb)'::regprocedure;") == 't')
    check('client and service roles cannot issue generation or mutate registry', sql("select bool_and(not has_function_privilege(r,'portal_private.issue_write_generation(jsonb)','EXECUTE') and not has_table_privilege(r,'portal_private.write_session_generation','INSERT,UPDATE,DELETE') and not has_sequence_privilege(r,'portal_private.write_generation_seq','USAGE,UPDATE')) from unnest(array['anon','authenticated','service_role']) r;") == 't')
    source = (pilot.ROOT / 'supabase/migrations/20261008000200_portal_write_generation.sql').read_text()
    for signature, declaration in [('portal_private.issue_write_generation(jsonb)', 'create function portal_private.issue_write_generation(event jsonb)'),
                                   ('portal_private.assert_write_session()', 'create or replace function portal_private.assert_write_session()')]:
        body = source.split(declaration, 1)[1].split('$$')[1]
        check('accepted native function unchanged: ' + signature, sql('select md5(prosrc) from pg_proc where oid=' + q(signature) + '::regprocedure;') == hashlib.md5(body.encode()).hexdigest())
    for attempt in range(3):
        time.sleep(1.01 - time.time() % 1)
        old = pilot.session(state['users']['adult']['email'])
        status, current = request('/auth/v1/token?grant_type=refresh_token', {'refresh_token': old['refresh_token']})
        check('native token refresh succeeds', status == 200)
        previous, fresh = pilot.claims(old['access_token']), pilot.claims(current['access_token'])
        if previous['iat'] == fresh['iat']:
            break
    check('same-second native generation advances', previous['iat'] == fresh['iat'] and previous['session_id'] == fresh['session_id'] and
          int(fresh['aiea_write_generation']) > int(previous['aiea_write_generation']))
    check('signed generation matches live private registry', sql('select user_id::text||\'/\'||generation::text from portal_private.write_session_generation where session_id=' +
          q(fresh['session_id']) + ';') == fresh['sub'] + '/' + fresh['aiea_write_generation'])
    version = next(v for v in state['versions'] if v['count'] == 36)
    before = sql("select (select count(*) from portal.mission_progress)||'/'||(select count(*) from portal.cohort_mission_delivery)||'/'||(select count(*) from portal.audit_event);")
    for school in [False, True]:
        body = {'workspace_id': state['school' if school else 'family'], 'program_version_id': version['id'], 'mission_id': version['missions'][0],
                'cohort_id' if school else 'learner_ref_id': state['cohort' if school else 'learner'], 'action': 'start'}
        route = '/rest/v1/rpc/' + ('record_cohort_delivery' if school else 'record_mission_progress')
        check('obsolete token denied at ' + ('SCHOOL' if school else 'FAMILY') + ' RPC', request(route, body, old['access_token'])[0] == 403)
        body['action'] = 'deliver' if school else 'complete'
        check('explicit start cannot be skipped', request(route, body, current['access_token'])[0] == 400)
    check('denied writes cause zero progress/delivery/audit mutations', before == sql("select (select count(*) from portal.mission_progress)||'/'||(select count(*) from portal.cohort_mission_delivery)||'/'||(select count(*) from portal.audit_event);"))
    check('native signout succeeds', request('/auth/v1/logout?scope=local', {}, current['access_token'])[0] == 204)
    check('signed-out token denied at native write RPC', request(route, body, current['access_token'])[0] == 403)


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ['prepare', 'check']:
        raise SystemExit('Usage: native-sequence-fixture.py prepare|check <private-local-status.json>')
    pilot.CREDS = Path(sys.argv[2]).resolve(); pilot.C = json.loads(pilot.CREDS.read_text())
    if pilot.C.get('API_URL') != 'http://127.0.0.1:54321' or not pilot.C.get('PUBLISHABLE_KEY', '').startswith('sb_publishable_'):
        raise SystemExit('Explicit loopback native credentials required')
    marker = json.loads((pilot.CREDS.parent / 'project/pilot.json').read_text())
    if marker.get('projectId') != 'aiea-portal-native-pilot':
        raise SystemExit('Isolated native project marker required')
    for name, digest in marker['migrations']:
        check('accepted migration unchanged: ' + name, hashlib.sha256((pilot.ROOT / 'supabase/migrations' / name).read_bytes()).hexdigest() == digest)
    pilot.STATE = pilot.CREDS.parent / 'pilot-state.json'
    STATE = pilot.CREDS.parent / 'sequence-state.json'
    try:
        {'prepare': prepare, 'check': validate}[sys.argv[1]]()
    finally:
        (pilot.CREDS.parent / ('sequence-' + sys.argv[1] + '-results.json')).write_text(json.dumps(pilot.RESULTS, indent=2))
