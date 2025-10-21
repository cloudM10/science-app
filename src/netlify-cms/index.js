import CMS from "netlify-cms-app";
import registerTableWidget from "./table-widget";
import registerPdfLinkWidget from "./pdf-link-widget";

CMS.init({
    config: {
        backend: {
            name: "github",
            repo: "cloudM10/science-app",
            branch: "main",
            auth_type: "implicit",
            base_url: "https://orca-app-xfbmd.ondigitalocean.app",
            auth_endpoint: "/auth",
        },
        media_folder: "static/uploads",
        public_folder: "/uploads",
    },
});

registerTableWidget(CMS);
registerPdfLinkWidget(CMS);
