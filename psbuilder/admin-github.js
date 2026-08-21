// Talking to GitHub: the token, loading the config, and writing it back.
//
// The token is only stored once a fetch has proved it works, and a save is
// refused outright if the config would fail the shared validation rules.

// ─── GitHub load / save ───
// Bump this whenever admin behaviour changes. It shows in the header, the
// browser tab, and the commit message of every config save.
const ADMIN_VERSION = '0.9.7';

const REPO_OWNER = 'ArchiTechGit';
const REPO_NAME = 'architechdemo';
const CONFIG_PATH = 'psbuilder/config.json';
let GITHUB_TOKEN = localStorage.getItem('psbuilder_admin_token') || '';
let CONFIG = null;
let CONFIG_SHA = null;

async function fetchConfigFromGitHub() {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_PATH}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
  const data = await res.json();
  CONFIG_SHA = data.sha;
  CONFIG = JSON.parse(decodeURIComponent(escape(atob(data.content))));
}

// GitHub is specific about why it said no, and the difference matters: a
// fine-grained token on an org repo often needs approving before it works.
function explainFailure(status) {
  if (status === 401) return 'That token was rejected (401). It may be mistyped, revoked, or expired.';
  if (status === 403) return 'Token understood but not allowed (403). If the org has not approved it yet, it stays blocked until an owner does.';
  if (status === 404) return 'Repo not visible to that token (404). Check it is scoped to ArchiTechGit/architechdemo with Contents access.';
  return 'GitHub returned ' + status + '.';
}

function showTokenError(message) {
  const box = document.getElementById('token-error');
  box.textContent = message;
  box.style.display = 'block';
  document.getElementById('forget-token').style.display =
    localStorage.getItem('psbuilder_admin_token') ? 'inline-block' : 'none';
}

function forgetToken() {
  localStorage.removeItem('psbuilder_admin_token');
  GITHUB_TOKEN = '';
  location.reload();
}

function useTypedToken() {
  const typed = document.getElementById('token-input').value.trim();
  if (!typed) { showTokenError('Paste a token first.'); return; }
  tryToken(typed, true);
}

// `interactive` means the user just typed it, so failures are worth saying
// loudly. A stored token that has gone stale fails quietly into the gate.
async function tryToken(token, interactive) {
  GITHUB_TOKEN = token;
  try {
    await fetchConfigFromGitHub();
  } catch (e) {
    // Never keep a token that does not work - that was the old bug.
    localStorage.removeItem('psbuilder_admin_token');
    const status = Number(String(e.message).match(/\d{3}/) || 0);
    document.getElementById('token-input').value = token;
    showTokenError(explainFailure(status) + (interactive ? '' : ' The saved token has been cleared.'));
    return false;
  }
  localStorage.setItem('psbuilder_admin_token', token);
  document.getElementById('token-gate').style.display = 'none';
  document.getElementById('admin-app').style.display = 'block';
  activeFlowId = CONFIG.flows.length ? CONFIG.flows[0].id : null;
  renderAdmin();
  return true;
}
function utf8ToBase64(str) { return btoa(unescape(encodeURIComponent(str))); }

let saving = false;
async function saveConfig() {
  const statusEl = document.getElementById('save-status');
  const btn = document.getElementById('save-btn');
  // A second click would race the first commit and lose to its own sha.
  if (saving) return;
  saving = true;
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  statusEl.textContent = 'Saving...';
  try {
    await doSave(statusEl);
  } catch (e) {
    statusEl.textContent = 'Save failed: ' + e.message + '. Nothing was written.';
  } finally {
    saving = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Save to GitHub'; }
  }
}

function explainSaveFailure(status) {
  if (status === 401) return 'Nothing was saved: the token is no longer valid. Paste a new one.';
  if (status === 403) return 'Nothing was saved: the token is not allowed to write here. If the org has not approved it, an owner has to.';
  if (status === 404) return 'Nothing was saved: the token cannot see this repo. Check it is scoped to ArchiTechGit/architechdemo.';
  if (status === 422) return 'Nothing was saved: GitHub rejected the file. Reload the page and try again.';
  if (status >= 500) return 'Nothing was saved: GitHub is having trouble. Wait a moment and save again.';
  return 'Nothing was saved: GitHub returned ' + status + '.';
}

// The same rules check.js runs. Writing a config that fails them would
// break someone else's estimate rather than this session.
function blockingProblems() {
  try { return PSEngine.validateConfig(CONFIG); }
  catch (e) { return ['the config could not be checked: ' + e.message]; }
}

async function doSave(statusEl) {
  const problems = blockingProblems();
  if (problems.length) {
    const shown = problems.slice(0, 4).map(m => '\u2022 ' + m).join('\n');
    const more = problems.length > 4 ? `\n...and ${problems.length - 4} more.` : '';
    statusEl.textContent = `Not saved: ${problems.length} problem${problems.length === 1 ? '' : 's'} to fix first.`;
    alert(`This would write a config the builder cannot use, so nothing was sent:\n\n${shown}${more}`);
    return;
  }
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `chore(psbuilder): update config via admin v${ADMIN_VERSION}`,
      content: utf8ToBase64(JSON.stringify(CONFIG, null, 2) + '\n'),
      sha: CONFIG_SHA,
      branch: 'master',
    }),
  });
  if (res.status === 409) {
    statusEl.textContent = 'Nothing was saved: someone else saved changes while you were editing. Reload the page and make your change again.';
    return;
  }
  if (!res.ok) {
    // GitHub's raw body is JSON and means nothing to the reader.
    statusEl.textContent = explainSaveFailure(res.status);
    return;
  }
  const data = await res.json();
  CONFIG_SHA = data.content.sha;
  statusEl.innerHTML = `<span style="color:var(--success);font-weight:700;">Saved</span> — <a href="${data.commit.html_url}" target="_blank" style="color:var(--cyan);">view commit</a>`;
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('version-badge').textContent = 'v' + ADMIN_VERSION;
  document.title = 'PS Builder — Admin v' + ADMIN_VERSION;
  const stored = localStorage.getItem('psbuilder_admin_token');
  if (stored) tryToken(stored, false);
});
