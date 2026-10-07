#!/usr/bin/env python3
"""Offline repository contract checks; does not claim to parse/execute PostgreSQL."""
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
FREEZE = 'docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md'
FREEZE_COMMIT = '052101670dc92b38c7ec15c88a2b07572e42d75b'
ALLOWED = {
    '.gitignore', '.env.example', 'portal/README.md',
    'scripts/portal/validate-foundation.py', 'scripts/portal/test-database.mjs',
    'supabase/config.toml', 'supabase/README.md',
    'supabase/migrations/20261006000100_portal_domains.sql',
    'supabase/migrations/20261006000200_portal_security.sql',
    'supabase/migrations/20261006000300_portal_guards.sql',
    'supabase/tests/bootstrap.pglite.sql', 'supabase/tests/foundation.sql',
    'supabase/tests/assertions.json',
    'docs/portal/AIEA_Portal_Sprint_01A_Implementation_Foundation_Report_v1.0.md',
    'docs/portal/AIEA_Portal_Sprint_01A_Independent_Audit_Handoff_v1.0.md',
    'docs/portal/AIEA_Portal_Sprint_01A_Correction_Report_v1.0.md',
}
DOMAINS = set('''user_profile workspace workspace_membership staff_authorization learner_ref
cohort cohort_teacher_assignment cohort_learner_assignment cohort_mission_delivery
program program_version program_version_locale mission mission_locale resource_asset
assessment assessment_locale assessment_item assessment_item_locale stripe_event
billing_reference entitlement mission_progress assessment_attempt assessment_response
evidence_record pilot_feedback audit_event'''.split())

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()

count = 0
def check(condition, label):
    global count
    if not condition:
        raise SystemExit('FAIL ' + label)
    count += 1
    print('PASS ' + label)

check(git('branch', '--show-current') == 'main', 'branch remains main')
check(git('rev-parse', 'HEAD') == FREEZE_COMMIT, 'no commit since architecture freeze')
check((ROOT/FREEZE).read_bytes() == subprocess.check_output(['git','show',f'{FREEZE_COMMIT}:{FREEZE}'],cwd=ROOT), 'canonical frozen artifact unchanged')
changed = set(filter(None, git('diff', '--name-only', 'HEAD').splitlines()))
changed |= set(filter(None, git('ls-files', '--others', '--exclude-standard').splitlines()))
check(changed <= ALLOWED, 'only approved foundation paths changed: ' + ', '.join(sorted(changed - ALLOWED)))
check(all((ROOT/p).exists() for p in ALLOWED), 'all scaffold and report files present')
check(not git('diff','--cached','--name-only'), 'nothing staged')
names = sorted(p.name for p in (ROOT/'supabase/migrations').glob('*.sql'))
check(names == sorted(Path(p).name for p in ALLOWED if '/migrations/' in p), 'migration ordering is explicit and complete')
sql = '\n'.join((ROOT/'supabase/migrations'/n).read_text() for n in names)
check(set(re.findall(r'create table portal\.(\w+)', sql)) == DOMAINS, 'exact frozen domain inventory')
check(all((ROOT/'supabase/migrations'/n).read_text().strip().endswith('commit;') for n in names), 'every migration is transactional')
check(not re.search(r'on delete\s+cascade|create\s+table\s+auth\.|create\s+policy.*\bto\s+anon\b', sql, re.I), 'no cascading customer deletion, child auth schema or anonymous policy')
check(json.loads((ROOT/'package.json').read_text()) == json.loads(git('show', 'HEAD:package.json')), 'application dependencies unchanged')
for sample in ['.env', '.env.local', '.env.production', 'supabase/.temp/project-ref', 'supabase/.branches/local']:
    ignored = subprocess.run(['git','check-ignore','--no-index','-q',sample], cwd=ROOT).returncode == 0
    check(ignored, f'local secret/state path ignored: {sample}')
check(subprocess.run(['git','check-ignore','--no-index','-q','.env.example'],cwd=ROOT).returncode == 1, 'example contract remains versionable')
values = dict(line.split('=',1) for line in (ROOT/'.env.example').read_text().splitlines() if line and not line.startswith('#'))
check(all(value == '' or (key == 'PORTAL_STRIPE_ENVIRONMENT' and value == 'test') for key,value in values.items()), 'environment contract contains only blanks and test mode')
inventory = json.loads((ROOT/'supabase/tests/assertions.json').read_text())
check(isinstance(inventory,list) and len(inventory)>=69 and len(inventory)==len(set(inventory)) and
      all(isinstance(label,str) and label.strip() for label in inventory), 'reviewed assertion inventory is nonempty and unique; runtime match required separately')
for p in sorted(ALLOWED):
    content = (ROOT/p).read_text()
    check(not re.search(r'(?:sk_(?:live|test)_[A-Za-z0-9]{16,}|sb_secret_[A-Za-z0-9_-]{16,}|whsec_[A-Za-z0-9]{16,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.)',content), 'no credential pattern in ' + p)
print(f'PASS {count} offline checks. SQL behavior is verified separately; remote/provider integration is not exercised.')
