const {
    encodePayload,
    getBaseUrl,
    randomState,
    secureFromRequest,
    serializeCookie,
} = require("./_utils");

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const DEFAULT_SCOPE = "repo";
const SCOPE = (process.env.GITHUB_OAUTH_SCOPE || DEFAULT_SCOPE)
    .split(" ")
    .filter(Boolean)
    .join(" ");

const METHOD_NOT_ALLOWED = JSON.stringify({ error: "method_not_allowed" });

const respondWithHandshakePage = (res, html, secure, cookieValue) => {
    if (cookieValue) {
        res.setHeader(
            "Set-Cookie",
            serializeCookie("cms_oauth", cookieValue, {
                secure,
                maxAge: 600,
            })
        );
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(html);
};

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(METHOD_NOT_ALLOWED);
        return;
    }

    if (!CLIENT_ID) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "missing_github_client_id" }));
        return;
    }

    const { redirect_uri: redirectUri = "/" } = req.query || {};

    const baseUrl = getBaseUrl(req);
    const callbackUrl = `${baseUrl}/api/callback`;
    const state = randomState();

    const payload = encodePayload({
        state,
        redirectUri,
        timestamp: Date.now(),
    });

    const secure = secureFromRequest(req);

    const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("client_id", CLIENT_ID);
    authorizeUrl.searchParams.set("scope", SCOPE);
    authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
    authorizeUrl.searchParams.set("state", state);

    const script = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Authorizing…</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#1f2933;background:#f5f7fa;}main{text-align:center;max-width:24rem;padding:0 1.5rem;}p{line-height:1.5;}</style>
</head>
<body>
    <main>
        <h1>Connecting to GitHub…</h1>
        <p>You can close this tab if nothing happens after authorization.</p>
    </main>
    <script>
        (function () {
            var provider = 'github';
            var origin = ${JSON.stringify(baseUrl)};
            var authorizeUrl = ${JSON.stringify(authorizeUrl.toString())};
            var handshakeMessage = 'authorizing:' + provider;

            function redirect() {
                window.location.replace(authorizeUrl);
            }

            window.addEventListener('message', function (event) {
                if (event.origin !== origin) {
                    return;
                }
                if (event.data === handshakeMessage) {
                    redirect();
                }
            });

            if (window.opener) {
                window.opener.postMessage(handshakeMessage, origin);
            }

            setTimeout(redirect, 500);
        })();
    </script>
</body>
</html>`;

    respondWithHandshakePage(res, script, secure, payload);
};
