/* ArchiTech Demo — Password Gate
 * To change the password, replace HASH with the SHA-256 of your new password.
 * Generate with: echo -n "YourNewPassword" | sha256sum
 * Current password: ArchiTech2024!
 */
(function () {
  var HASH = '1e21f96c12d90732faa4f8f949b76097c6f2c8889fcd99a6b452d9889536f6d3';
  var SESSION_KEY = 'architech_auth';

  if (sessionStorage.getItem(SESSION_KEY) === HASH) return;

  // Prevent flash of underlying content
  document.documentElement.style.visibility = 'hidden';

  var CSS = `
    #auth-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: #0D1825;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Roboto', -apple-system, sans-serif;
    }
    #auth-box {
      display: flex; flex-direction: column; align-items: center; gap: 28px;
      width: 320px;
    }
    #auth-logo {
      width: 180px; opacity: 0.9; mix-blend-mode: screen;
    }
    #auth-label {
      font-size: 9px; font-weight: 700; letter-spacing: 0.28em;
      text-transform: uppercase; color: #3D4F65;
    }
    #auth-form {
      display: flex; flex-direction: column; gap: 12px; width: 100%;
    }
    #auth-input {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(5,195,221,0.25);
      border-radius: 6px;
      color: #F0F6FC;
      font-size: 14px;
      letter-spacing: 0.08em;
      padding: 11px 14px;
      outline: none;
      width: 100%;
      transition: border-color 0.2s;
    }
    #auth-input:focus {
      border-color: rgba(5,195,221,0.7);
    }
    #auth-btn {
      background: #05C3DD;
      border: none; border-radius: 6px;
      color: #0D1825;
      cursor: pointer;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.2em;
      padding: 11px 14px;
      text-transform: uppercase;
      transition: opacity 0.2s;
      width: 100%;
    }
    #auth-btn:hover { opacity: 0.85; }
    #auth-error {
      color: #FF6B6B;
      font-size: 11px; letter-spacing: 0.1em;
      text-align: center;
      min-height: 16px;
    }
    @keyframes auth-shake {
      0%,100% { transform: translateX(0); }
      20%,60% { transform: translateX(-6px); }
      40%,80% { transform: translateX(6px); }
    }
    .auth-shake { animation: auth-shake 0.35s ease; }
  `;

  // Inject styles into <head> now (works before <body> exists)
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // Wait for <body> to exist before injecting the overlay
  document.addEventListener('DOMContentLoaded', function () {
    var overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div id="auth-box">
        <img id="auth-logo" src="/brand_assets/logo_darkbackground.png" alt="ArchiTech" />
        <span id="auth-label">Demo Access</span>
        <form id="auth-form" autocomplete="off">
          <input id="auth-input" type="password" placeholder="Enter password" autofocus />
          <button id="auth-btn" type="submit">Enter</button>
          <div id="auth-error"></div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    document.documentElement.style.visibility = 'visible';

    document.getElementById('auth-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var val = document.getElementById('auth-input').value;
      var errEl = document.getElementById('auth-error');
      errEl.textContent = '';

      var encoder = new TextEncoder();
      crypto.subtle.digest('SHA-256', encoder.encode(val)).then(function (buf) {
        var hex = Array.from(new Uint8Array(buf))
          .map(function (b) { return b.toString(16).padStart(2, '0'); })
          .join('');

        if (hex === HASH) {
          sessionStorage.setItem(SESSION_KEY, HASH);
          overlay.remove();
        } else {
          var inputEl = document.getElementById('auth-input');
          inputEl.value = '';
          errEl.textContent = 'Incorrect password';
          inputEl.classList.remove('auth-shake');
          void inputEl.offsetWidth; // reflow to restart animation
          inputEl.classList.add('auth-shake');
        }
      });
    });
  });
})();
