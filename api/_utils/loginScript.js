const LABEL_PATTERN = /^(\*|[\w-]+)$/i;
const TLD_PATTERN = /^[a-z0-9]{2,}$/i;

function isValidOrigin(origin) {
    if (!origin) {
        return false;
    }

    const [hostPart, portPart] = origin.split(":");

    if (portPart !== undefined) {
        if (!/^\d{1,5}$/.test(portPart)) {
            return false;
        }

        const portNumber = Number(portPart);
        if (portNumber < 1 || portNumber > 65535) {
            return false;
        }
    }

    if (hostPart === "localhost") {
        return true;
    }

    const labels = hostPart.split(".");

    if (labels.length < 2) {
        return false;
    }

    const isValidLabelSet = labels.every((segment, index) => {
        if (!LABEL_PATTERN.test(segment)) {
            return false;
        }

        if (index === labels.length - 1) {
            return TLD_PATTERN.test(segment) && segment !== "*";
        }

        return true;
    });

    return isValidLabelSet;
}

function parseOrigins() {
    const rawOrigins = process.env.ORIGINS;
    if (!rawOrigins) {
        throw new Error("ORIGINS environment variable must be defined");
    }

    const entries = rawOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (!entries.length) {
        throw new Error(
            "ORIGINS must include at least one hostname (without protocol). Wildcards are supported via *"
        );
    }

    const invalidEntry = entries.find((origin) => !isValidOrigin(origin));
    if (invalidEntry) {
        throw new Error(
            `Invalid origin "${invalidEntry}". ORIGINS must be a comma separated list of hostnames without protocol. Wildcards are supported via * and an optional :port may be supplied.`
        );
    }

    return entries;
}

function sanitizeForSingleQuotedString(value) {
    return value.replace(/'/g, "\\'");
}

module.exports = function generateLoginScript(oauthProvider, message, content) {
    const origins = parseOrigins();
    const payload =
        typeof content === "string" ? content : JSON.stringify(content);
    const sanitizedPayload = sanitizeForSingleQuotedString(payload);

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Authentication ${message}</title>
</head>
<body>
<script>
(function() {
    var origins = ${JSON.stringify(origins)};

    function matchesOrigin(arr, elem) {
        for (var i = 0; i < arr.length; i++) {
            var candidate = arr[i];
            if (candidate.indexOf('*') >= 0) {
                var regex = new RegExp(candidate.replace(/\./g, '\\\\.').replace(/\*/g, '[\\\\w_-]+'));
                if (elem.match(regex) !== null) {
                    return true;
                }
            } else if (candidate === elem) {
                return true;
            }
        }
        return false;
    }

    function receiveMessage(e) {
        var normalizedOrigin = e.origin.replace('https://', '').replace('http://', '');
        if (!matchesOrigin(origins, normalizedOrigin)) {
            console.log('Invalid origin:', e.origin);
            return;
        }
        window.opener.postMessage(
            'authorization:${oauthProvider}:${message}:${sanitizedPayload}',
            e.origin
        );
    }

    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:${oauthProvider}', '*');
})();
</script>
</body>
</html>`;
};
