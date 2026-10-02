"""Package a reviewed prototype commit and publish it to its own here.now Site.

Secrets, upload URLs and run state stay outside the repository. --dry-run creates
the exact allowlisted artifact without contacting here.now or publishing anything.
"""
from pathlib import Path, PurePosixPath
import argparse, concurrent.futures, hashlib, json, mimetypes, os, subprocess, sys, time
import urllib.request, urllib.error

PROTOTYPE = 'prototype/ui-pass2'
ROOT = Path(os.environ.get('PAPERTRAILS_RUN_DIR', str(Path.home()/'.papertrails/ui-pass2'))).resolve()

def allowed(path):
    parts = PurePosixPath(path).parts
    if not parts or any(p in ('..', '.') or p.startswith('.') for p in parts): return False
    if path in ('index.html', 'print-trail.html', 'script.js', 'style.css'): return True
    extension = PurePosixPath(path).suffix.lower()
    return ((parts[0] == 'src' and extension == '.js') or
            (parts[0] == 'vendor' and extension == '.js') or
            (parts[0] == 'data' and extension == '.yaml') or
            (parts[0] == 'images' and extension in ('.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.gif')))

def delivery_ready(state):
    primary = [entry for entry in state['prs'] if not entry.get('remedial')]
    return bool(state.get('implementationReady') and len(primary) >= 8 and all(e['status'] == 'merged' for e in primary))

def command(worktree, *args):
    return subprocess.check_output(['git', '-C', str(worktree), *args], text=True, encoding='utf-8', timeout=120).strip()

def package(worktree, commit, destination):
    paths = command(worktree, 'ls-tree', '-r', '--name-only', commit).splitlines()
    manifest = []
    for path in filter(allowed, paths):
        contents = subprocess.check_output(['git', '-C', str(worktree), 'show', f'{commit}:{path}'], timeout=120)
        target = destination / path; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(contents)
        manifest.append({'path': path, 'size': len(contents), 'contentType': mimetypes.guess_type(path)[0] or 'application/octet-stream', 'hash': hashlib.sha256(contents).hexdigest()})
    if not {'index.html', 'print-trail.html', 'data/trails.yaml', 'data/relations.yaml'}.issubset({m['path'] for m in manifest}):
        raise RuntimeError('Prototype artifact is missing its entry points or research data')
    metadata = json.dumps({'branch': PROTOTYPE, 'commit': commit, 'source': f'https://github.com/SamMackrill/PaperTrails/tree/{commit}'}, indent=2).encode()
    (destination/'prototype-version.json').write_bytes(metadata)
    manifest.append({'path': 'prototype-version.json', 'size': len(metadata), 'contentType': 'application/json', 'hash': hashlib.sha256(metadata).hexdigest()})
    return manifest

def credential():
    key = os.environ.get('HERENOW_API_KEY', '').strip()
    if not key:
        path = Path.home()/'.herenow/credentials'
        if path.exists(): key = path.read_text(encoding='utf-8').strip()
    if not key: raise RuntimeError('Authenticated here.now credentials are unavailable')
    return key

def request(url, payload=None, method='GET', key=None):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname != 'here.now': raise RuntimeError('API URL escaped here.now')
    headers = {'X-HereNow-Client': 'codex/direct-api', 'Content-Type': 'application/json'}
    if key: headers['Authorization'] = 'Bearer ' + key
    body = None if payload is None else json.dumps(payload).encode()
    try:
        response = urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers, method=method), timeout=90)
        return json.load(response)
    except urllib.error.HTTPError as error:
        # Never include request headers, credentials or presigned upload URLs in errors.
        details = error.read().decode(errors='replace')[:800]
        raise RuntimeError(f'here.now API HTTP {error.code}: {details}') from None

def atomic(path, value):
    temporary = path.with_suffix('.pending'); temporary.write_text(json.dumps(value, indent=2), encoding='utf-8'); os.replace(temporary, path)

def read_owner_file(slug, path, key):
    class SameHost(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            if urllib.parse.urlparse(newurl).hostname != 'here.now':
                raise RuntimeError('Owner file verification redirect changed host')
            return super().redirect_request(req, fp, code, msg, headers, newurl)
    url = f'https://here.now/api/v1/publish/{urllib.parse.quote(slug, safe="")}/files/{urllib.parse.quote(path, safe="/")}'
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + key, 'X-HereNow-Client': 't3-code/codex'})
    try:
        with urllib.request.build_opener(SameHost()).open(req, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'Owner artifact verification HTTP {error.code} for {path}') from None

def verify_live_artifact(slug, commit, manifest, key, fetch_file=None):
    fetch_file = fetch_file or read_owner_file
    files = {file['path']: file for file in manifest}
    paths = ['index.html', 'data/trails.yaml', 'src/trailController.js',
             'images/tapestry/landscape-b-revolutions.png', 'print-trail.html', 'prototype-version.json']
    paths += [path for path in files if path.endswith('-threads.webp')]
    for path in paths:
        if path not in files: raise RuntimeError(f'Live artifact manifest is missing {path}')
        contents = fetch_file(slug, path, key)
        if hashlib.sha256(contents).hexdigest() != files[path]['hash']:
            raise RuntimeError(f'Live artifact hash mismatch for {path}')
        if path == 'prototype-version.json':
            version = json.loads(contents)
            if version.get('commit') != commit or version.get('branch') != PROTOTYPE:
                raise RuntimeError('Live deployment commit or branch mismatch')

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--dry-run', action='store_true'); args = parser.parse_args()
    state = json.loads((ROOT/'state.json').read_text(encoding='utf-8'))
    if not args.dry_run and not delivery_ready(state):
        raise RuntimeError('The complete primary stack must land on the prototype branch before publication')
    worktree = Path(state['worktreeRoot'])/'integration'
    if command(worktree, 'branch', '--show-current') != PROTOTYPE or command(worktree, 'status', '--porcelain'):
        raise RuntimeError('Integration worktree is not a clean prototype checkout')
    command(worktree, 'fetch', 'origin', PROTOTYPE, 'main')
    if command(worktree, 'rev-parse', 'origin/main') != state['baseline']:
        raise RuntimeError('Remote main moved since baseline; investigate without altering it')
    command(worktree, 'merge', '--ff-only', 'origin/'+PROTOTYPE)
    commit = command(worktree, 'rev-parse', 'HEAD')
    if args.dry_run:
        # Dry runs can package the final implementation worktree to validate the manifest.
        primary = [entry for entry in state['prs'] if not entry.get('remedial')]
        candidate = Path(primary[-1]['worktree']); commit = command(candidate, 'rev-parse', 'HEAD'); worktree = candidate
    destination = ROOT/'deployments'/commit; destination.mkdir(parents=True, exist_ok=True)
    manifest = package(worktree, commit, destination)
    atomic(ROOT/'deployment-manifest.json', {'commit': commit, 'files': manifest})
    print(f'Prototype artifact: {len(manifest)} files, {sum(m["size"] for m in manifest)} bytes, {commit}', flush=True)
    if args.dry_run: return
    tests = sorted(worktree.glob('tools/*.test.mjs'))
    subprocess.run(['node', '--test', *map(str, tests)], cwd=worktree, check=True, timeout=120)
    subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'tools/prototype', '-p', 'test_*.py'], cwd=worktree, check=True, timeout=120)
    subprocess.run(['node', str(worktree/'tools/prototype/browser-audit.mjs'), str(destination)], cwd=worktree, check=True, timeout=180)
    key = credential()
    session_path = ROOT/'herenow-pending.json'
    session = json.loads(session_path.read_text(encoding='utf-8')) if session_path.exists() else None
    payload = {'files': manifest, 'ttlSeconds': None, 'displayName': 'Paper Trails · research prototype', 'displayDescription': 'Continuous historical landscape and sourced idea trails. Prototype branch; production remains separate.'}
    if session and session['commit'] != commit:
        raise RuntimeError('A different deployment is pending; reconcile it before replacing the Site')
    deployment = state.get('deployment')
    if not session:
        if deployment:
            slug = deployment['slug']; current = request(f'https://here.now/api/v1/publish/{slug}', key=key)
            if current['currentVersionId'] != deployment['versionId']: raise RuntimeError('Prototype Site changed externally; version conflict')
            payload['baseVersionId'] = deployment['versionId']
            created = request(f'https://here.now/api/v1/publish/{slug}', payload, 'PUT', key)
        else:
            created = request('https://here.now/api/v1/publish', payload, 'POST', key)
        session = {'commit': commit, 'created': created}; atomic(session_path, session)
    created = session['created']; upload = created['upload']
    def put(target):
        path = target['path']
        if path not in {f['path'] for f in manifest}: raise RuntimeError('Upload path is absent from the artifact')
        parsed = urllib.parse.urlparse(target['url'])
        if parsed.scheme != 'https' or not parsed.hostname.endswith('.r2.cloudflarestorage.com'): raise RuntimeError('Unexpected upload host')
        contents = (destination/path).read_bytes()
        for attempt in range(3):
            try:
                req = urllib.request.Request(target['url'], data=contents, headers=target['headers'], method='PUT')
                with urllib.request.urlopen(req, timeout=120) as response: response.read()
                return
            except Exception:
                if attempt == 2: raise RuntimeError(f'Upload failed for {path}') from None
                time.sleep(2 ** attempt)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: list(pool.map(put, upload['uploads']))
    finalized = request(upload['finalizeUrl'], {'versionId': upload['versionId']}, 'POST', key)
    status = finalized.get('publishStatus', {})
    if not finalized.get('success') or status.get('state') != 'live' or status.get('persistence') != 'permanent':
        raise RuntimeError('here.now did not confirm a permanent live Site')
    url = finalized['siteUrl'].rstrip('/')+'/'
    verify_live_artifact(finalized['slug'], commit, manifest, key)
    state = json.loads((ROOT/'state.json').read_text(encoding='utf-8'))
    state['deployment'] = {'slug': finalized['slug'], 'versionId': finalized['currentVersionId'], 'url': url, 'commit': commit, 'publishStatus': status}
    atomic(ROOT/'state.json', state); session_path.unlink()
    print(url, flush=True)

if __name__ == '__main__': main()
