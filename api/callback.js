const fetch = require("node-fetch");

const {
    decodePayload,
    getBaseUrl,
    parseCookies,
    secureFromRequest,
    serializeCookie,
} = require("./_utils");

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

const removeCookie = (secure) =>
    serializeCookie("cms_oauth", "", { maxAge: 0, secure, sameSite: "Lax" });

const sendScriptResponse = (
    res,
    baseUrl,
    messageType,
    payload,
    secure,
    status = 200
) => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Authentication ${
      messageType === "success" ? "Complete" : "Error"
  }</title>
  <style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#1f2933;background:#f5f7fa;}main{text-align:center;max-width:24rem;padding:0 1.5rem;}p{line-height:1.5;}button{margin-top:1.5rem;padding:0.5rem 1.25rem;border-radius:999px;border:0;background:#2563eb;color:#fff;font-size:0.9rem;cursor:pointer;}button:focus{outline:2px solid #93c5fd;outline-offset:4px;}</style>
</head>
<body>
  <main>
    <h1>${messageType === "success" ? "Signed in" : "Unable to sign in"}</h1>
    <p>${
        messageType === "success"
            ? "You can close this window."
            : "Please return to the previous tab and try again."
    }</p>
    <button type="button" onclick="window.close()">Close window</button>
  </main>
  <script>
    (function () {
      var origin = ${JSON.stringify(baseUrl)};
      var provider = 'github';
      var data = ${JSON.stringify(payload)};
      var message = 'authorization:' + provider + ':${messageType}:' + JSON.stringify(data);

      function post(message) {
        if (window.opener) {
          window.opener.postMessage(message, origin);
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage(message, origin);
        } else {
          console.log(messageType === 'success' ? 'OAuth success' : 'OAuth error', data);
        }
      }

      post(message);
      setTimeout(function () {
        window.close();
      }, 1500);
    })();
  </script>
</body>
</html>`;

    if (secure !== undefined) {
        res.setHeader("Set-Cookie", removeCookie(secure));
    }
    res.statusCode = status;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(html);
};

const sendError = (res, baseUrl, secure, error, status = 400) => {
    const payload = {
        message: error,
    };
    sendScriptResponse(res, baseUrl, "error", payload, secure, status);
};

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "method_not_allowed" }));
        return;
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "missing_github_oauth_config" }));
        return;
    }

    const baseUrl = getBaseUrl(req);
    const secure = secureFromRequest(req);

    const { code, state } = req.query || {};

    if (!code || !state) {
        sendError(res, baseUrl, secure, "missing_oauth_params", 400);
        return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const storedPayload = cookies.cms_oauth;

    if (!storedPayload) {
        sendError(res, baseUrl, secure, "missing_oauth_cookie", 400);
        return;
    }

    let original;
    try {
        original = decodePayload(storedPayload);
    } catch (error) {
        sendError(res, baseUrl, secure, "invalid_oauth_cookie", 400);
        return;
    }

    if (original.state !== state) {
        sendError(res, baseUrl, secure, "state_mismatch", 400);
        return;
    }

    const params = new URLSearchParams();
    params.set("client_id", CLIENT_ID);
    params.set("client_secret", CLIENT_SECRET);
    params.set("code", code);
    params.set("redirect_uri", `${baseUrl}/api/callback`);
    params.set("state", state);

    let tokenResponse;
    try {
        tokenResponse = await fetch(GITHUB_TOKEN_URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        });
    } catch (error) {
        sendError(res, baseUrl, secure, "token_exchange_failed", 502);
        return;
    }

    if (!tokenResponse.ok) {
        sendError(res, baseUrl, secure, "token_response_not_ok", 502);
        return;
    }

    let tokenJson;
    try {
        tokenJson = await tokenResponse.json();
    } catch (error) {
        sendError(res, baseUrl, secure, "invalid_token_response", 502);
        return;
    }

    if (tokenJson.error) {
        sendError(
            res,
            baseUrl,
            secure,
            tokenJson.error_description || tokenJson.error || "oauth_error",
            502
        );
        return;
    }

    const accessToken = tokenJson.access_token;
    if (!accessToken) {
        sendError(res, baseUrl, secure, "missing_access_token", 502);
        return;
    }

    const payload = {
        token: accessToken,
        provider: "github",
    };

    sendScriptResponse(res, baseUrl, "success", payload, secure, 200);
};
