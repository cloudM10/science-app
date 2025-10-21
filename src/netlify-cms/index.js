import CMS from "netlify-cms-app";
import registerTableWidget from "./table-widget";
import registerPdfLinkWidget from "./pdf-link-widget";

CMS.init({
    config: {
        backend: {
            name: "git-gateway",
            branch: "deploy_netlify",
        },
    },
});

registerTableWidget(CMS);
registerPdfLinkWidget(CMS);
