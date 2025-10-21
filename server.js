const path = require("path");
const express = require("express");
const { spawn } = require("child_process");
const { createProxyMiddleware } = require("http-proxy-middleware");

const appPort = process.env.PORT || 3000;
const proxyPort = process.env.NETLIFY_CMS_PROXY_PORT || 8081;
const proxyHost = process.env.NETLIFY_CMS_PROXY_HOST || "127.0.0.1";
const proxyMode = process.env.NETLIFY_CMS_PROXY_MODE || "git";
const repoRoot = process.env.GIT_REPO_DIRECTORY || __dirname;
const publicDir = path.resolve(__dirname, "public");

let proxyProcess;

const ensurePublicDir = () => {
    if (!require("fs").existsSync(publicDir)) {
        throw new Error(
            `Static bundle not found at ${publicDir}. Please run \"npm run build\" first.`
        );
    }
};

const startProxyServer = () => {
    const proxyScript = require.resolve(
        "netlify-cms-proxy-server/dist/index.js"
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
        const messageSuffix =
            code !== null ? `code ${code}` : `signal ${signal}`;
        console.warn(`netlify-cms-proxy-server exited (${messageSuffix})`);
        proxyProcess = null;
    });

    proxyProcess.on("error", (error) => {
        console.error("Failed to launch netlify-cms-proxy-server", error);
        process.exit(1);
    });
};

const stopProxyServer = () => {
    if (proxyProcess && !proxyProcess.killed) {
        proxyProcess.kill();
    }
    proxyProcess = null;
};

const registerShutdownHooks = () => {
    const cleanup = () => {
        stopProxyServer();
    };

    ["SIGINT", "SIGTERM", "SIGUSR2"].forEach((signal) => {
        process.once(signal, () => {
            cleanup();
            process.exit(0);
        });
    });

    process.once("exit", cleanup);
};

const startApp = () => {
    ensurePublicDir();
    startProxyServer();
    registerShutdownHooks();

    const app = express();

    app.use(
        "/api/v1",
        createProxyMiddleware({
            target: `http://${proxyHost}:${proxyPort}`,
            changeOrigin: true,
            logLevel: process.env.NETLIFY_CMS_PROXY_LOG_LEVEL || "warn",
        })
    );

    app.use(express.static(publicDir, { extensions: ["html"] }));

    app.use((req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        const fallbackFile = path.join(publicDir, "404.html");
        res.sendFile(fallbackFile, (err) => {
            if (err) {
                res.status(404).send("Not found");
            }
        });
    });

    app.listen(appPort, () => {
        console.log(
            `Static site server started on http://localhost:${appPort} (proxy -> http://${proxyHost}:${proxyPort}/api/v1)`
        );
    });
};

startApp();
