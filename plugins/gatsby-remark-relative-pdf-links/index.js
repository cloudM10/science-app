const path = require("path");
const { selectAll } = require("unist-util-select");
const { defaults, find, isString } = require("lodash");

const cheerioModule = require("cheerio");

const resolveCheerioLoad = (mod) => {
    if (!mod) {
        return null;
    }

    if (typeof mod.load === "function") {
        return mod.load.bind(mod);
    }

    if (typeof mod.default?.load === "function") {
        return mod.default.load.bind(mod.default);
    }

    return null;
};

const cheerioLoad = resolveCheerioLoad(cheerioModule);

const slash = (inputPath) => {
    const isExtendedLengthPath = /^\\\\\?\\/.test(inputPath);
    if (isExtendedLengthPath) {
        return inputPath;
    }

    return inputPath.replace(/\\/g, "/");
};

const defaultPluginOptions = {
    staticFolderName: "static",
    include: [],
    exclude: [],
};

const isPdfExtension = (resourcePath) =>
    typeof resourcePath === "string" &&
    path.extname(resourcePath).toLowerCase() === ".pdf";

const normalizePdfSrc = (src, options) => {
    if (!isString(src)) {
        return null;
    }

    const normalized = slash(src.trim());

    if (!normalized) {
        return null;
    }

    if (/^https?:\/\//i.test(normalized)) {
        return null;
    }

    const staticFolder = slash(options.staticFolderName)
        .replace(/^\/+/, "")
        .replace(/\/+$/, "");

    const parts = normalized.split("/").filter(Boolean);

    if (!parts.length) {
        return null;
    }

    if (parts[0] === staticFolder) {
        parts.shift();
    }

    const mediaIndex = parts.lastIndexOf("media");
    if (mediaIndex !== -1) {
        const afterMedia = parts.slice(mediaIndex + 1);
        return ["media", ...afterMedia].join("/");
    }

    return parts.join("/");
};

const findMatchingFile = (src, files, options) => {
    const normalizedSrc = normalizePdfSrc(src, options);

    if (!normalizedSrc) {
        return null;
    }

    const result = find(files, (file) => {
        const staticPath = slash(
            path.join(options.staticFolderName, normalizedSrc)
        );
        return slash(path.normalize(file.absolutePath)).endsWith(staticPath);
    });

    return result || null;
};

module.exports = async function gatsbyRemarkRelativePdfLinks(
    { files, markdownNode, markdownAST },
    pluginOptions = {}
) {
    const options = defaults({}, pluginOptions, defaultPluginOptions);

    if (!markdownNode.fileAbsolutePath) {
        return;
    }

    const directory = path.dirname(markdownNode.fileAbsolutePath);

    selectAll("link", markdownAST).forEach((_node) => {
        const node = _node;
        if (!isString(node.url)) {
            return;
        }

        if (!path.isAbsolute(node.url) || !isPdfExtension(node.url)) {
            return;
        }

        const file = findMatchingFile(node.url, files, options);

        if (!file) {
            return;
        }

        node.url = path.relative(directory, file.absolutePath);
    });

    selectAll("html", markdownAST).forEach((_node) => {
        const node = _node;

        if (typeof node.value !== "string") {
            return;
        }

        if (!node.value.toLowerCase().includes("<a")) {
            return;
        }

        if (!cheerioLoad) {
            return;
        }

        const $ = cheerioLoad(node.value);
        const anchors = $("a");

        if (anchors.length === 0) {
            return;
        }

        anchors.each((_, element) => {
            const url = $(element).attr("href");

            if (!isString(url)) {
                return;
            }

            if (!path.isAbsolute(url) || !isPdfExtension(url)) {
                return;
            }

            const file = findMatchingFile(url, files, options);

            if (!file) {
                return;
            }

            const relativeSrc = path.relative(directory, file.absolutePath);
            $(element).attr("href", relativeSrc);
            const bodyHtml = $("body").html() ?? "";
            node.value = bodyHtml;
        });
    });
};

module.exports.defaultPluginOptions = defaultPluginOptions;
module.exports.findMatchingFile = findMatchingFile;
