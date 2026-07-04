import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Root from "../layout/Root";
import Landing from "../pages/Landing/Landing";

const HomeGate = lazy(() => import("../pages/Home/HomeGate.jsx"));
const DashboardGate = lazy(() => import("../pages/Dashboard/DashboardGate.jsx"));
const ContentGate = lazy(() => import("../pages/Content/ContentGate.jsx"));
const LinksGate = lazy(() => import("../pages/Links/LinksGate.jsx"));
const RedirectsGate = lazy(() => import("../pages/Redirects/RedirectsGate.jsx"));
const IssuesGate = lazy(() => import("../pages/Issues/IssuesGate.jsx"));
const LighthouseGate = lazy(() => import("../pages/Lighthouse/LighthouseGate.jsx"));
const SecurityGate = lazy(() => import("../pages/Security/SecurityGate.jsx"));
const ContentInsightsGate = lazy(() => import("../pages/ContentInsights/ContentInsightsGate.jsx"));
const TechStackGate = lazy(() => import("../pages/TechStack/TechStackGate.jsx"));
const GalleryGate = lazy(() => import("../pages/Gallery/GalleryGate.jsx"));
const NetworkGate = lazy(() => import("../pages/Network/NetworkGate.jsx"));
const ChartsGate = lazy(() => import("../pages/Charts/ChartsGate.jsx"));
const ReportsLab = lazy(() => import("../pages/ReportsLab/ReportsLab.jsx"));

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
