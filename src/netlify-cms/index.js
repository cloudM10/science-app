import CMS from "netlify-cms-app";
import registerTableWidget from "./table-widget";
import registerPdfLinkWidget from "./pdf-link-widget";

CMS.init();

registerTableWidget(CMS);
registerPdfLinkWidget(CMS);
