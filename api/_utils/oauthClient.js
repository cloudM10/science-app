const { AuthorizationCode } = require("simple-oauth2");

const oauthProvider = process.env.OAUTH_PROVIDER || "github";

function assertEnv(name) {
    if (!process.env[name]) {
        throw new Error(`${name} environment variable must be defined`);
    }
}

assertEnv("OAUTH_CLIENT_ID");
assertEnv("OAUTH_CLIENT_SECRET");
assertEnv("ORIGINS");

const config = {
    client: {
        id: process.env.OAUTH_CLIENT_ID,
        secret: process.env.OAUTH_CLIENT_SECRET,
    },
    auth: {
        tokenHost: process.env.GIT_HOSTNAME || "https://github.com",
        tokenPath: process.env.OAUTH_TOKEN_PATH || "/login/oauth/access_token",
        authorizePath: process.env.OAUTH_AUTHORIZE_PATH || "/login/oauth/authorize",
    },
};

const oauthClient = new AuthorizationCode(config);

function removeTrailingSlash(value) {
    return value ? value.replace(/\/+$/, "") : value;
}

function removeLeadingSlash(value) {
    return value ? value.replace(/^\/+/, "") : value;
}

function joinUrl(base, path) {
    if (!path) {
        return removeTrailingSlash(base);
    }
    return `${removeTrailingSlash(base)}/${removeLeadingSlash(path)}`;
}

function getDefaultBasePath() {
    const basePath = process.env.OAUTH_BASE_PATH || "/api";
    if (basePath === "/") {
        return "";
    }
    return basePath;
}

function getBaseUrl(req) {
    const explicitBase = process.env.SERVER_BASE_URL || process.env.BASE_URL || process.env.EXTERNAL_BASE_URL;
    if (explicitBase) {
        return removeTrailingSlash(explicitBase);
    }

    const forwardedProto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const base = `${forwardedProto}://${host}`;
    return joinUrl(base, getDefaultBasePath());
}

function getRedirectUri(req) {
    const explicitRedirect = process.env.REDIRECT_URL;
    if (explicitRedirect) {
        return removeTrailingSlash(explicitRedirect);
    }
    return joinUrl(getBaseUrl(req), "callback");
}

function getScopes() {
    return process.env.SCOPES || "repo,user";
}

function getAuthTarget() {
    return process.env.AUTH_TARGET || "_self";
}

module.exports = {
    oauthClient,
    oauthProvider,
    getRedirectUri,
    getScopes,
    getAuthTarget,
    getBaseUrl,
    joinUrl,
};
