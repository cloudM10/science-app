import CMS from "netlify-cms-app";
import registerTableWidget from "./table-widget";
import registerPdfLinkWidget from "./pdf-link-widget";

CMS.init({
    config: {
        load_config_file: true, // загружает config.yml автоматически
        config_file_path: "/admin/config.yml", // путь к файлу на сайте
        backend: {
            name: "github",
            repo: "cloudM10/science-app",
            branch: "main",
            auth_type: "implicit",
            base_url:
                process.env.GATSBY_NETLIFY_CMS_BASE_URL ||
                "https://science-app-umber.vercel.app/api",
            auth_endpoint: "auth",
        },
        media_folder: "static/uploads",
        public_folder: "/uploads",
    },
});

registerTableWidget(CMS);
registerPdfLinkWidget(CMS);
