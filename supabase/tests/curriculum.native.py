#!/usr/bin/env python3
"""01C disposable loopback Auth/PostgREST/RLS/handler checks. Run after 01B fixtures.

Uses accepted helper source without modifying it. Fixture publication uses real
managed TOTP and existing guards. No hosted endpoint, package importer or real user.
"""
import importlib.util
import json
import hashlib
import base64
import hmac
import struct
import time
from pathlib import Path

spec = importlib.util.spec_from_file_location('accepted_entry', Path(__file__).with_name('portal-entry.native.py'))
t = importlib.util.module_from_spec(spec)
spec.loader.exec_module(t)
users = json.loads(t.STATE.read_text())
results = []


def check(label, value):
    results.append({'label': label, 'pass': bool(value)})
    print(('PASS ' if value else 'FAIL ') + label, flush=True)
    if not value:
        raise SystemExit('Synthetic native curriculum check failed: ' + label)


def uid(n):
    return '1c000000-0000-0000-0000-' + str(n).zfill(12)


def session(n):
    email = users[str(n)]['email']
    if not email.endswith('@example.invalid'):
        raise SystemExit('Synthetic adults only')
    st, link, _ = t.request(t.C['API_URL'], '/auth/v1/admin/generate_link', {'type': 'magiclink', 'email': email}, admin=True)
    if st != 200:
        raise SystemExit('Synthetic session setup failed')
    st, s, _ = t.request(t.C['API_URL'], '/auth/v1/verify', {'type': 'magiclink', 'token_hash': link['hashed_token']})
    if st != 200:
        raise SystemExit('Synthetic session verification failed')
    return s['access_token']


def claim_sql(token):
    return "select set_config('request.jwt.claims'," + t.quote(json.dumps(t.claims(token))) + ',true);'


def setup():
    if t.sql("select count(*) from portal.program where id='" + uid(1) + "';") != '0':
        raise SystemExit('Use a fresh disposable stack; 01C fixtures already exist')
    # A dedicated synthetic publisher avoids enrolling a second factor through
    # the accepted 01B publisher's ordinary aal1 session. Operator bootstrap is
    # confined to this disposable fixture, using the accepted audited guard.
    st, publisher, _ = t.request(t.C['API_URL'], '/auth/v1/admin/users', {'email': 'portal-01c-publisher-' + str(int(time.time())) + '@example.invalid', 'email_confirm': True}, admin=True)
    if st != 200:
        raise SystemExit('Synthetic publisher provisioning failed')
    users['17'] = {'id': publisher['id'], 'email': publisher['email']}
    t.sql("insert into portal.user_profile(user_id,adult_confirmed_at) values ('" + publisher['id'] + "',now());")
    staff = session(17)
    st, factor, _ = t.request(t.C['API_URL'], '/auth/v1/factors', {'factor_type': 'totp', 'friendly_name': '01C synthetic publication'}, staff)
    if st != 200:
        raise SystemExit('Synthetic TOTP enrollment failed')
    st, challenge, _ = t.request(t.C['API_URL'], '/auth/v1/factors/' + factor['id'] + '/challenge', {}, staff)
    secret = factor['totp']['secret']
    key = base64.b32decode(secret + '=' * (-len(secret) % 8))
    digest = hmac.new(key, struct.pack('>Q', int(time.time()) // 30), hashlib.sha1).digest()
    offset = digest[-1] & 15
    code = str((struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7fffffff) % 1000000).zfill(6)
    st, s, _ = t.request(t.C['API_URL'], '/auth/v1/factors/' + factor['id'] + '/verify', {'challenge_id': challenge['id'], 'code': code}, staff)
    if st != 200:
        raise SystemExit('Synthetic TOTP verification failed')
    staff = s['access_token']
    t.sql('begin;' + claim_sql(staff) + "insert into portal.staff_authorization(user_id,capabilities) values ('" + publisher['id'] + "',array['CURRICULUM_PUBLISH']);commit;")
    statements = ['begin;', claim_sql(staff), "insert into portal.program(id,program_key) values ('" + uid(1) + "','synthetic-01c');"]
    for n in range(1, 9):
        v = uid(100 + n)
        statements.append("insert into portal.program_version(id,program_id,version_key,default_locale,fallback_locale) values ('" + v + "','" + uid(1) + "','01c-v" + str(n) + "','en-US'," + ('null' if n == 6 else "'en-US'") + ');')
        locales = ['en-US', 'es'] if n in [1, 2] else ['en-US']
        for locale in locales:
            title = ('Programa sintético ' if locale == 'es' else 'Synthetic 01C ') + str(n)
            statements.append("insert into portal.program_version_locale(program_version_id,locale_code,title,description,guidance,status) values ('" + v + "'," + t.quote(locale) + ',' + t.quote(title) + ",'<b>Literal description</b>','Synthetic adult guidance','PUBLISHED');")
        for seq in ([3, 1, 2] if n == 1 else [1] if n == 2 else []):
            m = uid(1000 + n * 10 + seq)
            statements.append("insert into portal.mission(id,program_version_id,mission_key,sequence) values ('" + m + "','" + v + "','mission-" + str(seq) + "'," + str(seq) + ');')
            for locale in locales:
                statements.append("insert into portal.mission_locale(mission_id,program_version_id,locale_code,title,instructions,reflection,content_blocks,status) values ('" + m + "','" + v + "'," + t.quote(locale) + ',' + t.quote('Synthetic mission ' + str(seq)) + ',' + t.quote('<img src=x onerror="window.bad=true">\nSynthetic instructions ' + str(seq)) + ",'Synthetic reflection','[{\"unrendered\":\"never-return\"}]','PUBLISHED');")
        if n != 4:
            statements.append("update portal.program_version set status='REVIEW_READY' where id='" + v + "';")
        if n not in [4, 5]:
            h = hashlib.sha256(('synthetic-01c-v' + str(n)).encode()).hexdigest()
            statements.append("update portal.program_version set status='PUBLISHED',content_hash='" + h + "' where id='" + v + "';")
    statements.append('commit;')
    t.sql('\n'.join(statements))
    family_token, school_token = session(2), session(4)
    for n in [1, 2, 3, 6, 7, 8, 9]:
        # 9 is a second independent billing basis for version 1.
        version_n = 1 if n == 9 else n
        w = t.FAMILY if version_n in [1, 3, 6] else t.SCHOOL
        token = family_token if w == t.FAMILY else school_token
        status = 'SUSPENDED' if n == 7 else 'REVOKED' if n == 8 else 'ACTIVE'
        t.sql('begin;' + claim_sql(token) + "insert into portal.billing_reference(id,workspace_id,program_version_id,initiating_user_id,offering_key,environment,idempotency_key,stripe_account_id,stripe_product_id,stripe_price_id,status) values ('" + uid(200 + n) + "','" + w + "','" + uid(100 + version_n) + "','" + t.claims(token)['sub'] + "','synthetic-01c','test','synthetic-01c-" + str(n) + "','acct_synthetic','prod_synthetic','price_synthetic','PAID');insert into portal.entitlement(id,workspace_id,program_version_id,billing_reference_id,status) values ('" + uid(300 + n) + "','" + w + "','" + uid(100 + version_n) + "','" + uid(200 + n) + "','" + status + "');commit;")
    t.sql('begin;' + claim_sql(staff) + "update portal.program_version set status='RETIRED' where id='" + uid(103) + "';commit;")
    st, owner, _ = t.request(t.C['API_URL'], '/auth/v1/admin/users', {'email': 'portal-01c-owner-' + str(int(time.time())) + '@example.invalid', 'email_confirm': True}, admin=True)
    if st != 200:
        raise SystemExit('Synthetic school owner provisioning failed')
    users['16'] = {'id': owner['id'], 'email': owner['email']}
    t.sql("insert into portal.user_profile(user_id,adult_confirmed_at) values ('" + owner['id'] + "',now());insert into portal.workspace_membership(workspace_id,workspace_kind,user_id,role) values ('" + t.SCHOOL + "','SCHOOL','" + owner['id'] + "','OWNER');")
    (t.CREDS.parent / 'curriculum-fixtures.json').write_text(json.dumps({'users': users, 'program': uid(1), 'version': uid(101), 'school_version': uid(102), 'mission': uid(1011)}))
    (t.CREDS.parent / 'curriculum-fixtures.json').chmod(0o600)


def get(token, w=t.FAMILY, v=None, m=None, locale='en-US', extra=''):
    path = '/api/portal/curriculum?workspace_id=' + w + '&locale=' + locale
    if v:
        path += '&program_version_id=' + v
    if m:
        path += '&mission_id=' + m
    return t.request(t.APP, path + extra, cookie='aiea_portal_local=' + token)


def snapshot():
    tables = ['learner_ref', 'cohort', 'cohort_teacher_assignment', 'cohort_learner_assignment', 'mission_progress', 'cohort_mission_delivery', 'assessment_attempt', 'assessment_response', 'evidence_record', 'pilot_feedback']
    return [t.sql("select coalesce(jsonb_agg(to_jsonb(x) order by id),'[]'::jsonb) from portal." + table + ' x;') for table in tables]


def main():
    setup()
    tokens = {n: session(n) for n in [2, 3, 4, 8, 16]}
    before = snapshot()
    for n, label, w in [(2, 'FAMILY owner', t.FAMILY), (3, 'SCHOOL assigned teacher', t.SCHOOL), (4, 'SCHOOL admin', t.SCHOOL), (8, 'SCHOOL teacher without cohort assignment', t.SCHOOL), (16, 'SCHOOL owner', t.SCHOOL)]:
        st, data, h = get(tokens[n], w)
        check(label + ' can read entitled curriculum', st == 200 and data['view'] == 'catalog')
        check(label + ' receives private/no-store response', 'private, no-store' in h.get('Cache-Control', ''))
    st, data, _ = get(tokens[8])
    own = [x for x in data['programs'] if x['program_id'] == uid(1)]
    check('family catalog exact versions and duplicate billing bases deduped', {x['program_version_id'] for x in own} == {uid(101), uid(103), uid(106)} and len(own) == 3)
    st, data, _ = get(tokens[8], t.SCHOOL)
    check('school catalog excludes draft/review/suspended/revoked versions', [x['program_version_id'] for x in data['programs'] if x['program_id'] == uid(1)] == [uid(102)])
    for w, v in [(t.FAMILY, uid(102)), (t.SCHOOL, uid(101))]:
        st, _, _ = get(tokens[8], w, v)
        check('selected-workspace isolation ' + ('family' if w == t.FAMILY else 'school'), st == 404)
    st, raw, _ = t.request(t.C['API_URL'], '/rest/v1/program_version?select=id&id=in.(' + uid(101) + ',' + uid(102) + ')', token=tokens[8])
    check('native RLS union allows both versions while API isolates selected workspace', st == 200 and len(raw) == 2)
    st, data, _ = get(tokens[2], v=uid(101))
    check('non-eight mission count and ordering', st == 200 and [m['sequence'] for m in data['missions']] == [1, 2, 3])
    check('program body projection and guidance', data['program']['description'] == '<b>Literal description</b>' and data['program']['guidance'] == 'Synthetic adult guidance')
    st, data, _ = get(tokens[2], v=uid(101), m=uid(1011))
    check('mission shell contains published literal instructions and reflection', st == 200 and data['mission']['instructions'].startswith('<img') and data['mission']['reflection'] == 'Synthetic reflection')
    check('response excludes arbitrary JSON, resources and privileged data', all(x not in json.dumps(data) for x in ['content_blocks', 'never-return', 'billing_reference', 'stripe_', 'published_by', 'blob_path']))
    for v, expected in [(uid(103), 200), (uid(104), 404), (uid(105), 404), (uid(107), 404), (uid(108), 404)]:
        st, _, _ = get(tokens[8], t.SCHOOL if v in [uid(107), uid(108)] else t.FAMILY, v)
        check('version visibility ' + v[-3:], st == expected)
    st, data, _ = get(tokens[2], v=uid(103))
    check('retired entitled version and empty mission list preserved', st == 200 and data['missions'] == [])
    for locale, expected in [('es', 'es'), ('fr-FR', 'en-US')]:
        st, data, _ = get(tokens[2], v=uid(101), m=uid(1011), locale=locale)
        check('requested/fallback locale ' + locale, st == 200 and data['program']['resolved_locale'] == expected)
    st, _, _ = get(tokens[2], v=uid(106), locale='fr-FR')
    check('unavailable locale never falls back implicitly to default', st == 409)
    st, data, _ = get(tokens[2], locale='fr-FR')
    check('catalog unavailable locale remains explicit', any(x['program_version_id'] == uid(106) and x['resolved_locale'] is None and x['title'] is None for x in data['programs']))
    st, _, _ = get(tokens[8], v=uid(101), m=uid(1021))
    check('mismatched mission/version denied even when both versions authorized elsewhere', st == 404)
    st, _, _ = t.request(t.APP, '/api/portal/curriculum?workspace_id=' + t.FAMILY)
    check('anonymous denied', st == 401)
    st, _, _ = t.request(t.APP, '/api/portal/curriculum?workspace_id=' + t.FAMILY, cookie='aiea_portal_local=' + tokens[2] + '; aiea_portal_logout_local=' + tokens[2])
    check('pending signout denied', st == 401)
    expired = t.claims(tokens[2])
    expired['exp'] = int(time.time()) - 120
    head = base64.urlsafe_b64encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode()).decode().rstrip('=')
    body = base64.urlsafe_b64encode(json.dumps(expired).encode()).decode().rstrip('=')
    unsigned = head + '.' + body
    sig = base64.urlsafe_b64encode(hmac.new(t.C['JWT_SECRET'].encode(), unsigned.encode(), hashlib.sha256).digest()).decode().rstrip('=')
    st, _, _ = get(unsigned + '.' + sig, v=uid(101))
    check('correctly signed expired local curriculum session denied', st == 401)
    for suffix in ['&workspace_id=' + t.SCHOOL, '&unknown=1', '&locale=es', '&mission_id=bad']:
        st, _, _ = get(tokens[2], extra=suffix)
        check('duplicate/unsupported/malformed request ' + suffix.split('=')[0], st == 400)
    st, _, _ = t.request(t.APP, '/api/portal/curriculum?workspace_id=' + t.FAMILY, {'mutation': True}, cookie='aiea_portal_local=' + tokens[2])
    check('POST mutation forbidden', st == 405)
    for table, field, value, expected in [('workspace', 'id', t.FAMILY, 403), ('workspace_membership', 'user_id', users['2']['id'], 403), ('user_profile', 'user_id', users['2']['id'], 403)]:
        t.sql('update portal.' + table + " set status='INACTIVE' where " + field + '=' + t.quote(value) + ';')
        try:
            st, _, _ = get(tokens[2], v=uid(101))
            check('inactive ' + table + ' denies', st == expected)
        finally:
            t.sql('update portal.' + table + " set status='ACTIVE' where " + field + '=' + t.quote(value) + ';')
    check('browsing leaves all learning/cohort/learner/evidence/assessment records unchanged', snapshot() == before)
    st, _, _ = t.request(t.APP, '/api/portal/auth', {'action': 'signout'}, cookie='aiea_portal_local=' + tokens[2])
    check('native application signout succeeds', st == 200)
    st, _, _ = get(tokens[2], v=uid(101))
    check('native signed-out session cannot read curriculum', st == 401)
    (t.CREDS.parent / 'curriculum-native-results.json').write_text(json.dumps(results, indent=2))
    print('PASS ' + str(len(results)) + ' native curriculum checks', flush=True)


if __name__ == '__main__':
    main()
