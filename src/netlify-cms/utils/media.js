export const extractRawPath = (input) => {
    if (input == null) {
        return "";
    }

    if (typeof input === "string") {
        return input;
    }

    if (Array.isArray(input)) {
        if (input.length === 0) {
            return "";
        }

        return extractRawPath(input[0]);
    }

    if (typeof input === "object") {
        if (typeof input.path === "string") {
            return input.path;
        }

        if (typeof input.url === "string") {
            return input.url;
        }

        if (typeof input.toJS === "function") {
            return extractRawPath(input.toJS());
        }
    }

    return String(input);
};

export const ensureLeadingSlash = (value) => {
    if (!value) {
        return "";
    }

    if (value.startsWith("/")) {
        return value;
    }

    return `/${value}`;
};

export const normalizeMediaPath = (value) => {
    const raw = extractRawPath(value);

    if (!raw) {
        return "";
    }

    const trimmed = raw.trim();

    if (!trimmed) {
        return "";
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    const withoutRelativePrefix = trimmed.replace(/^\.\/?/, "");
    const withoutLeadingSlash = withoutRelativePrefix.replace(/^\/+/u, "");

    if (!withoutLeadingSlash) {
        return "";
    }

    if (withoutLeadingSlash.startsWith("media/")) {
        return ensureLeadingSlash(withoutLeadingSlash);
    }

    if (withoutLeadingSlash.startsWith("static/")) {
        const strippedStatic = withoutLeadingSlash.replace(/^static\//u, "");

        if (strippedStatic.startsWith("media/")) {
            return ensureLeadingSlash(strippedStatic);
        }

        return ensureLeadingSlash(`media/${strippedStatic}`);
    }

    return ensureLeadingSlash(`media/${withoutLeadingSlash}`);
};

export const normalizePdfPath = (value) => {
    const normalized = normalizeMediaPath(value);

    if (!normalized) {
        return "";
    }

    const [pathOnly] = normalized.split(/[?#]/);

    return pathOnly || normalized;
};

export const extractFileName = (value) => {
    const normalized = normalizePdfPath(value);

    if (!normalized) {
        return "";
    }

    const segments = normalized.split("/");
    const last = segments[segments.length - 1] || "";

    return last.replace(/\.[^/.]+$/, "");
};

export const isPdfPath = (value) => {
    const normalized = normalizePdfPath(value);

    if (!normalized) {
        return false;
    }

    return /\.pdf$/i.test(normalized);
};
