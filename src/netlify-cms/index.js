import CMS from "netlify-cms-app";
import yaml from "js-yaml";
import registerTableWidget from "./table-widget";
import registerPdfLinkWidget from "./pdf-link-widget";

const CONFIG_PATH = "/admin/config.yml";

function resolveBaseUrlOverride() {
    const globalObject =
        typeof window !== "undefined"
            ? window
            : typeof globalThis !== "undefined"
            ? globalThis
            : {};

    const fromWindow =
        (typeof globalObject.GATSBY_NETLIFY_CMS_BASE_URL === "string" &&
            globalObject.GATSBY_NETLIFY_CMS_BASE_URL.trim()) ||
        (globalObject.__ENV__ &&
            typeof globalObject.__ENV__.GATSBY_NETLIFY_CMS_BASE_URL ===
                "string" &&
            globalObject.__ENV__.GATSBY_NETLIFY_CMS_BASE_URL.trim()) ||
        (globalObject.__RUNTIME_CONFIG__ &&
            typeof globalObject.__RUNTIME_CONFIG__
                .GATSBY_NETLIFY_CMS_BASE_URL === "string" &&
            globalObject.__RUNTIME_CONFIG__.GATSBY_NETLIFY_CMS_BASE_URL.trim()) ||
        (typeof globalObject.NETLIFY_CMS_BASE_URL === "string" &&
            globalObject.NETLIFY_CMS_BASE_URL.trim());

    let fromMeta;

    if (typeof document !== "undefined") {
        const metaTag = document.querySelector(
            'meta[name="netlify-cms-base-url"]'
        );
        fromMeta = metaTag?.getAttribute("content")?.trim();
    }

    const fromBuild =
        (typeof process !== "undefined" &&
            typeof process.env?.GATSBY_NETLIFY_CMS_BASE_URL === "string" &&
            process.env.GATSBY_NETLIFY_CMS_BASE_URL.trim()) ||
        (typeof process !== "undefined" &&
            typeof process.env?.NETLIFY_CMS_BASE_URL === "string" &&
            process.env.NETLIFY_CMS_BASE_URL.trim());

    return fromWindow || fromMeta || fromBuild;
}

async function bootstrapCMS() {
    try {
        const response = await fetch(CONFIG_PATH, { cache: "no-cache" });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const parsedConfig = yaml.load(text);

        if (!parsedConfig || typeof parsedConfig !== "object") {
            throw new Error("Config file is empty or invalid");
        }

        const baseUrlOverride = resolveBaseUrlOverride();
        if (baseUrlOverride) {
            parsedConfig.backend = parsedConfig.backend || {};
            parsedConfig.backend.base_url = baseUrlOverride;
        }

        CMS.init({ config: parsedConfig });
    } catch (error) {
        console.error("Failed to initialize Netlify CMS", error);
        const container = document.createElement("div");
        container.style.margin = "2rem";
        container.style.fontFamily = "sans-serif";
        container.style.color = "#b91c1c";
        container.innerHTML = `
            <h1>Netlify CMS</h1>
            <p>Не вдалося завантажити <code>${CONFIG_PATH}</code>.</p>
            <p>${error.message}</p>
        `;
        document.body.appendChild(container);
    }
}

registerTableWidget(CMS);
registerPdfLinkWidget(CMS);

bootstrapCMS();
