const path = require(`path`);
const { spawn } = require(`child_process`);
const { createFilePath } = require(`gatsby-source-filesystem`);
const {
    POST_CONTENT_TYPES,
    SLUG_CONFIG,
    isPostContentType,
    getSlugForContentType,
} = require("./src/config/app-configuration");

exports.createPages = async ({ graphql, actions, reporter }) => {
    const { createPage } = actions;

    // GraphQL запрос для получения всех markdown файлов
    const result = await graphql(
        `
            {
                allMarkdownRemark(
                    sort: { fields: [frontmatter___date], order: DESC }
                    limit: 1000
                ) {
                    nodes {
                        fields {
                            contentType
                            slug
                        }
                        frontmatter {
                            template
                        }
                    }
                }
            }
        `
    );

    // Обработка ошибок GraphQL
    if (result.errors) {
        reporter.panicOnBuild(
            `There was an error loading your markdown content`,
            result.errors
        );
        return;
    }

    const allMarkdownNodes = result.data.allMarkdownRemark.nodes;

    // Универсальная функция для создания страниц с навигацией
    const createPostPages = (nodes, templatePath) => {
        if (nodes.length === 0) return;

        nodes.forEach((node, index) => {
            const prevSlug = index > 0 ? nodes[index - 1].fields.slug : null;
            const nextSlug =
                index < nodes.length - 1 ? nodes[index + 1].fields.slug : null;

            createPage({
                path: node.fields.slug,
                component: path.resolve(templatePath),
                context: {
                    slug: node.fields.slug,
                    prevSlug,
                    nextSlug,
                },
            });
        });
    };

    // Группируем ноды по типу контента
    const nodesByType = allMarkdownNodes.reduce((acc, node) => {
        const contentType = node.fields?.contentType;
        if (contentType) {
            if (!acc[contentType]) acc[contentType] = [];
            acc[contentType].push(node);
        }
        return acc;
    }, {});

    // Создаем страницы для контента с навигацией
    // Используем конфигурацию из app-configuration.js
    POST_CONTENT_TYPES.forEach((contentType) => {
        if (nodesByType[contentType]) {
            createPostPages(
                nodesByType[contentType],
                "./src/templates/post-template.js"
            );
        }
    });

    // Создаем страницы с кастомными шаблонами (pages)
    if (nodesByType.pages) {
        nodesByType.pages.forEach((node) => {
            if (node.frontmatter.template && node.fields && node.fields.slug) {
                const templateFile = `${String(node.frontmatter.template)}.js`;

                createPage({
                    path: node.fields.slug,
                    component: path.resolve(`src/templates/${templateFile}`),
                    context: {
                        slug: node.fields.slug,
                    },
                });
            }
        });
    }
};

exports.onCreateNode = ({ node, actions, getNode }) => {
    const { createNodeField } = actions;

    if (node.internal.type === `MarkdownRemark`) {
        const relativeFilePath = createFilePath({
            node,
            getNode,
        });

        const fileNode = getNode(node.parent);

        createNodeField({
            node,
            name: `contentType`,
            value: fileNode.sourceInstanceName,
        });

        // Автоматическое создание slug на основе конфигурации из app-configuration.js
        const sourceInstanceName = fileNode.sourceInstanceName;
        if (SLUG_CONFIG.hasOwnProperty(sourceInstanceName)) {
            const prefix = SLUG_CONFIG[sourceInstanceName];
            const slugValue =
                sourceInstanceName === "pages"
                    ? relativeFilePath
                    : `${prefix}${relativeFilePath}`;

            createNodeField({
                name: `slug`,
                node,
                value: slugValue,
            });
        }
    }
};

exports.createSchemaCustomization = ({ actions }) => {
    const { createTypes } = actions;

    createTypes(`
    type SiteSiteMetadata {
      title: String
      subtitle: String
      description: String
      author: Author
      siteUrl: String
      socialLinks: [Social]
      social: Twitter
    }

    type Author {
      name: String
      summary: String
    }
    
    type Twitter {
      twitter: String
    }

    type Social {
      name: String
      url: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
      template: String
      fullname: String
      achievements: String
    profile_image: File @fileByRelativePath
    social_image: File @fileByRelativePath
    link_image: File @fileByRelativePath
    link: String
    id: Int
    }

    type Fields {
      slug: String
      contentType: String
    }
  `);
};

exports.createResolvers = ({ createResolvers }) => {
    const resolveImageField = (fieldName) => async (source, args, context) => {
        const value = source[fieldName];

        if (!value) {
            return null;
        }

        if (typeof value === "object" && value.internal?.type === "File") {
            return value;
        }

        if (Array.isArray(value)) {
            return null;
        }

        if (typeof value !== "string") {
            return null;
        }

        let normalizedPath = value.trim();

        if (!normalizedPath) {
            return null;
        }

        normalizedPath = normalizedPath.replace(/^\/+/, "");

        if (normalizedPath.startsWith("media/")) {
            normalizedPath = normalizedPath.substring("media/".length);
        }

        const file = await context.nodeModel.findOne({
            type: "File",
            query: {
                filter: {
                    sourceInstanceName: { eq: "media" },
                    relativePath: { eq: normalizedPath },
                },
            },
        });

        return file || null;
    };

    createResolvers({
        Frontmatter: {
            profile_image: {
                type: "File",
                resolve: resolveImageField("profile_image"),
            },
            social_image: {
                type: "File",
                resolve: resolveImageField("social_image"),
            },
            link_image: {
                type: "File",
                resolve: resolveImageField("link_image"),
            },
        },
    });
};

let proxyProcess = null;
let proxyCleanupRegistered = false;

const stopProxyProcess = () => {
    if (proxyProcess && !proxyProcess.killed) {
        proxyProcess.kill();
    }
    proxyProcess = null;
};

const registerProxyCleanup = (reporter) => {
    if (proxyCleanupRegistered) {
        return;
    }

    proxyCleanupRegistered = true;

    const cleanupHandler = () => {
        stopProxyProcess();
    };

    process.once("exit", cleanupHandler);
    process.once("SIGINT", () => {
        cleanupHandler();
        process.exit(0);
    });
    process.once("SIGTERM", () => {
        cleanupHandler();
        process.exit(0);
    });
    process.once("SIGUSR2", () => {
        cleanupHandler();
        process.kill(process.pid, "SIGUSR2");
    });

    reporter.info(`Netlify CMS proxy cleanup handlers registered`);
};

const startProxyProcess = (reporter) => {
    if (process.env.NETLIFY_CMS_PROXY_DISABLED === "true") {
        reporter.info(
            `Netlify CMS proxy server disabled via NETLIFY_CMS_PROXY_DISABLED`
        );
        return;
    }

    if (proxyProcess) {
        reporter.info(`Netlify CMS proxy server is already running`);
        return;
    }

    const proxyScript = require.resolve(
        "netlify-cms-proxy-server/dist/index.js"
    );
    const proxyPort = process.env.NETLIFY_CMS_PROXY_PORT || "8081";
    const proxyMode = process.env.NETLIFY_CMS_PROXY_MODE || "fs";
    const repoRoot = process.env.GIT_REPO_DIRECTORY || path.resolve(__dirname);

    reporter.info(
        `Starting Netlify CMS proxy server on port ${proxyPort} (mode: ${proxyMode})`
    );

    proxyProcess = spawn(process.execPath, [proxyScript], {
        cwd: repoRoot,
        stdio: "inherit",
        env: {
            ...process.env,
            PORT: proxyPort,
            MODE: proxyMode,
            GIT_REPO_DIRECTORY: repoRoot,
        },
    });

    proxyProcess.on("exit", (code, signal) => {
        if (code !== null) {
            reporter.warn(`Netlify CMS proxy server exited with code ${code}`);
        } else if (signal) {
            reporter.warn(
                `Netlify CMS proxy server killed with signal ${signal}`
            );
        }
        proxyProcess = null;
    });

    proxyProcess.on("error", (error) => {
        reporter.panic(
            `Failed to start Netlify CMS proxy server: ${error.message}`
        );
    });

    registerProxyCleanup(reporter);
};

exports.onCreateDevServer = ({ reporter }) => {
    startProxyProcess(reporter);
};
