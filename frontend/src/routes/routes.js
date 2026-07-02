import { createBrowserRouter } from "react-router-dom";
import Root from "../layout/Root";
import Landing from "../pages/Landing/Landing";
import HomeGate from "../pages/Home/HomeGate.jsx";
import DashboardGate from "../pages/Dashboard/DashboardGate.jsx";
import ContentGate from "../pages/Content/ContentGate.jsx";
import LinksGate from "../pages/Links/LinksGate.jsx";
import RedirectsGate from "../pages/Redirects/RedirectsGate.jsx";
import IssuesGate from "../pages/Issues/IssuesGate.jsx";
import LighthouseGate from "../pages/Lighthouse/LighthouseGate.jsx";
import SecurityGate from "../pages/Security/SecurityGate.jsx";
import ContentInsightsGate from "../pages/ContentInsights/ContentInsightsGate.jsx";
import TechStackGate from "../pages/TechStack/TechStackGate.jsx";
import GalleryGate from "../pages/Gallery/GalleryGate.jsx";
import NetworkGate from "../pages/Network/NetworkGate.jsx";
import ChartsGate from "../pages/Charts/ChartsGate.jsx";
import ReportsLab from "../pages/ReportsLab/ReportsLab.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children:[
        {index:true, Component: Landing},
        { path: "/home", Component: HomeGate },
        { path: "/dashboard", Component: DashboardGate },
        { path: "/content", Component: ContentGate },
        { path: "/links", Component: LinksGate },
        { path: "/redirects", Component: RedirectsGate },
        { path: "/issues", Component: IssuesGate },
        { path: "/lighthouse", Component: LighthouseGate },
        { path: "/security", Component: SecurityGate },
        { path: "/content-insights", Component: ContentInsightsGate },
        { path: "/techstack", Component: TechStackGate },
        { path: "/charts", Component: ChartsGate },
        { path: "/network", Component: NetworkGate },
        { path: "/gallery", Component: GalleryGate },
        { path: "/lab", Component: ReportsLab }
    ]
  },
]);
export default router;
