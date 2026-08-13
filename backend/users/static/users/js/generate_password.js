// "Generate password" button on the admin's "Add user" form. The password
// never leaves the browser as a separate secret — it's generated locally and
// dropped straight into the normal password1/password2 fields, then revealed
// once so the admin can copy it before saving (Django hashes it on save; this
// page is the only place it's ever shown in plain text).
(function () {
  function generatePassword() {
    // 15 cryptographically random bytes, base64url-ish — comfortably clears
    // Django's default validators (length, not-all-numeric, not a common word).
    var bytes = new Uint8Array(15);
    crypto.getRandomValues(bytes);
    var password = btoa(String.fromCharCode.apply(null, bytes))
      .replace(/\+/g, "A").replace(/\//g, "B").replace(/=/g, "");
    return password + "!9";
  }

  function init() {
    var pw1 = document.getElementById("id_password1");
    var pw2 = document.getElementById("id_password2");
    if (!pw1 || !pw2) return; // change form's separate password page has no password1/2

    var wrap = document.createElement("div");
    wrap.style.marginTop = "8px";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "button";
    button.textContent = "Generate secure password";

    var reveal = document.createElement("input");
    reveal.type = "text";
    reveal.readOnly = true;
    reveal.style.marginLeft = "8px";
    reveal.style.width = "220px";
    reveal.style.fontFamily = "monospace";
    reveal.placeholder = "Click Generate…";

    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "button";
    copyBtn.textContent = "Copy";
    copyBtn.style.marginLeft = "8px";
    copyBtn.disabled = true;

    var hint = document.createElement("p");
    hint.className = "help";
    hint.style.marginTop = "4px";
    hint.textContent = "Copy this now and hand it to them — it won't be shown again after you save.";

    button.addEventListener("click", function () {
      var value = generatePassword();
      pw1.value = value;
      pw2.value = value;
      reveal.value = value;
      copyBtn.disabled = false;
    });
    copyBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(reveal.value);
      copyBtn.textContent = "Copied!";
      setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
    });

    wrap.appendChild(button);
    wrap.appendChild(reveal);
    wrap.appendChild(copyBtn);
    wrap.appendChild(hint);
    pw2.parentNode.insertBefore(wrap, pw2.nextSibling);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
