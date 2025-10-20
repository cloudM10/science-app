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

const findMatchingFile = (src, files, options) => {
    const result = find(files, (file) => {
        const staticPath = slash(path.join(options.staticFolderName, src));
        return slash(path.normalize(file.absolutePath)).endsWith(staticPath);
    });

    if (!result) {
        throw new Error(
            `No matching file found for src "${src}" in static folder "${options.staticFolderName}".`
        );
    }

    return result;
};

module.exports = async function gatsbyRemarkRelativeImages(
    { files, markdownNode, markdownAST },
    pluginOptions = {}
) {
    const options = defaults({}, pluginOptions, defaultPluginOptions);

    if (!markdownNode.fileAbsolutePath) {
        return;
    }

    const directory = path.dirname(markdownNode.fileAbsolutePath);

    selectAll("image", markdownAST).forEach((_node) => {
        const node = _node;
        if (!isString(node.url)) {
            return;
        }

        if (!path.isAbsolute(node.url) || !path.extname(node.url)) {
            return;
        }

        const file = findMatchingFile(node.url, files, options);
        node.url = path.relative(directory, file.absolutePath);
    });

    selectAll("html", markdownAST).forEach((_node) => {
        const node = _node;

        if (typeof node.value !== "string") {
            return;
        }

        if (node.value.toLowerCase().includes("<img") === false) {
            return;
        }

        if (!cheerioLoad) {
            return;
        }

        const $ = cheerioLoad(node.value);
        const images = $("img");

        if (images.length === 0) {
            return;
        }

        images.each((_, element) => {
            const url = $(element).attr("src");

            if (!isString(url)) {
                return;
            }

            if (!path.isAbsolute(url) || !path.extname(url)) {
                return;
            }

            const file = findMatchingFile(url, files, options);
            const src = path.relative(directory, file.absolutePath);
            $(element).attr("src", src);
            const bodyHtml = $("body").html() ?? "";
            node.value = bodyHtml;
        });
    });
};

module.exports.defaultPluginOptions = defaultPluginOptions;
module.exports.findMatchingFile = findMatchingFile;
