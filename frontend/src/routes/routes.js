import { createBrowserRouter } from "react-router-dom";
import Root from "../layout/Root";
import Landing from "../pages/Landing/Landing";
import DashboardGate from "../pages/Dashboard/DashboardGate.jsx";
import ContentGate from "../pages/Content/ContentGate.jsx";
import LinksGate from "../pages/Links/LinksGate.jsx";
import RedirectsGate from "../pages/Redirects/RedirectsGate.jsx";
import IssuesGate from "../pages/Issues/IssuesGate.jsx";
import LighthouseGate from "../pages/Lighthouse/LighthouseGate.jsx";
import SecurityGate from "../pages/Security/SecurityGate.jsx";
import ReportsLab from "../pages/ReportsLab/ReportsLab.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children:[
        {index:true, Component: Landing},
        { path: "/dashboard", Component: DashboardGate },
        { path: "/content", Component: ContentGate },
        { path: "/links", Component: LinksGate },
        { path: "/redirects", Component: RedirectsGate },
        { path: "/issues", Component: IssuesGate },
        { path: "/lighthouse", Component: LighthouseGate },
        { path: "/security", Component: SecurityGate },
        { path: "/lab", Component: ReportsLab }
    ]
  },
]);
export default router;
