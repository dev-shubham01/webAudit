import { createBrowserRouter } from "react-router-dom";
import Root from "../layout/Root";
import Landing from "../pages/Landing/Landing";
import DashboardGate from "../pages/Dashboard/DashboardGate.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children:[
        {index:true, Component: Landing},
        { path: "/dashboard", Component: DashboardGate }
    ]
  },
]);
export default router;
