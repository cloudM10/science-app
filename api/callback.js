const {
    oauthClient,
    oauthProvider,
    getRedirectUri,
} = require("./_utils/oauthClient");
const generateLoginScript = require("./_utils/loginScript");

function extractAccessToken(token) {
    if (token && token.token) {
        if (token.token.access_token) {
            return token.token.access_token;
        }
        if (token.token.token && token.token.token.access_token) {
            return token.token.token.access_token;
        }
    }
    return undefined;
}

function buildHtmlResponse(provider, message, content) {
    try {
        return generateLoginScript(provider, message, content);
    } catch (originError) {
        console.error("Invalid ORIGINS configuration", originError);
        return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Authentication ${message}</title>
</head>
<body>
    <pre style="color:#b91c1c;font-family:monospace;white-space:pre-wrap;">
CMS OAuth configuration error: ${originError.message}
    </pre>
</body>
</html>`;
    }
}

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const code = req.query.code;
    if (!code) {
        res.status(400).send("Missing OAuth code");
        return;
    }

    const redirectUri = getRedirectUri(req);
    const tokenOptions = { code, redirect_uri: redirectUri };
    if (oauthProvider === "gitlab") {
        tokenOptions.client_id = process.env.OAUTH_CLIENT_ID;
        tokenOptions.client_secret = process.env.OAUTH_CLIENT_SECRET;
        tokenOptions.grant_type = "authorization_code";
    }

    try {
        const result = await oauthClient.getToken(tokenOptions);
        const token = oauthClient.createToken(result);
        const accessToken = extractAccessToken(token);
        if (!accessToken) {
            throw new Error("Unable to extract access token from response");
        }

        const html = buildHtmlResponse(oauthProvider, "success", {
            token: accessToken,
            provider: oauthProvider,
        });

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.status(200).send(html);
    } catch (error) {
        console.error("OAuth callback error", error);
        const payload = JSON.stringify({ message: error.message });
        const html = buildHtmlResponse(oauthProvider, "error", payload);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        const statusCode =
            error && error.message && /config/i.test(error.message) ? 500 : 200;
        res.status(statusCode).send(html);
    }
};
