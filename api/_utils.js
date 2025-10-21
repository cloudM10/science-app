const crypto = require("crypto");

const TEN_MINUTES = 60 * 10;

const secureFromRequest = (req) => {
    const protoHeader = req.headers["x-forwarded-proto"];
    if (Array.isArray(protoHeader)) {
        return protoHeader.includes("https");
    }
    if (typeof protoHeader === "string") {
        return (
            protoHeader.split(",").map((value) => value.trim())[0] === "https"
        );
    }
    const host = req.headers.host || "";
    return host.includes("localhost") ? false : true;
};

const getBaseUrl = (req) => {
    const protoHeader = req.headers["x-forwarded-proto"];
    let protocol;
    if (Array.isArray(protoHeader)) {
        protocol = protoHeader[0];
    } else if (typeof protoHeader === "string") {
        protocol = protoHeader.split(",")[0];
    }
    if (!protocol) {
        protocol = (req.headers.host || "").includes("localhost")
            ? "http"
            : "https";
    }
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return `${protocol}://${host}`;
};

const serializeCookie = (
    name,
    value,
    {
        maxAge = TEN_MINUTES,
        secure = true,
        httpOnly = true,
        sameSite = "Lax",
    } = {}
) => {
    const segments = [`${name}=${value}`];
    segments.push("Path=/");
    if (httpOnly) segments.push("HttpOnly");
    if (secure) segments.push("Secure");
    if (sameSite) segments.push(`SameSite=${sameSite}`);
    if (typeof maxAge === "number") segments.push(`Max-Age=${maxAge}`);
    return segments.join("; ");
};

const parseCookies = (cookieHeader = "") => {
    return cookieHeader.split(";").reduce((acc, part) => {
        const trimmed = part.trim();
        if (!trimmed) return acc;
        const [key, ...rest] = trimmed.split("=");
        acc[key] = rest.length > 0 ? rest.join("=") : "";
        return acc;
    }, {});
};

const encodePayload = (data) => {
    return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
};

const decodePayload = (value) => {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json);
};

const randomState = () => crypto.randomBytes(24).toString("hex");

module.exports = {
    decodePayload,
    encodePayload,
    getBaseUrl,
    parseCookies,
    randomState,
    secureFromRequest,
    serializeCookie,
};
