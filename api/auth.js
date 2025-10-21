const randomstring = require("randomstring");
const {
    oauthClient,
    getRedirectUri,
    getScopes,
    oauthProvider,
} = require("./_utils/oauthClient");

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const redirectUri = getRedirectUri(req);
        const authParams = {
            redirect_uri: redirectUri,
            scope: getScopes(),
            state: randomstring.generate(32),
        };
        authParams.redirectURI = redirectUri;

        const authorizationUri = oauthClient.authorizeURL(authParams);

        res.setHeader("Cache-Control", "no-store");
        res.writeHead(302, {
            Location: authorizationUri,
            "Content-Type": "text/plain",
        });
        res.end(`Redirecting to ${oauthProvider} OAuth provider`);
    } catch (error) {
        console.error("OAuth authorization error", error);
        res.status(500).json({ error: "OAuth authorization error" });
    }
};
