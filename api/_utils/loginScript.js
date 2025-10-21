const REQUIRED_ORIGIN_PATTERN = /^((\*|([\w_-]{2,}))\.)*(([\w_-]{2,})\.)+(\w{2,})(,((\*|([\w_-]{2,}))\.)*(([\w_-]{2,})\.)+(\w{2,}))*$/;

function parseOrigins() {
    const rawOrigins = process.env.ORIGINS;
    if (!rawOrigins) {
        throw new Error("ORIGINS environment variable must be defined");
    }

    if (!rawOrigins.match(REQUIRED_ORIGIN_PATTERN)) {
        throw new Error(
            "ORIGINS must be a comma separated list of allowed origins (without protocol). Wildcards are supported via *"
        );
    }

    return rawOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);
}

function sanitizeForSingleQuotedString(value) {
    return value.replace(/'/g, "\\'");
}

module.exports = function generateLoginScript(oauthProvider, message, content) {
    const origins = parseOrigins();
    const payload = typeof content === "string" ? content : JSON.stringify(content);
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
