import { createBrowserRouter } from "react-router-dom";
import Root from "../layout/Root";
import Landing from "../pages/Landing/Landing";
import DashboardGate from "../pages/Dashboard/DashboardGate.jsx";
import ContentGate from "../pages/Content/ContentGate.jsx";
import ReportsLab from "../pages/ReportsLab/ReportsLab.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children:[
        {index:true, Component: Landing},
        { path: "/dashboard", Component: DashboardGate },
        { path: "/content", Component: ContentGate },
        { path: "/lab", Component: ReportsLab }
    ]
  },
]);
export default router;
