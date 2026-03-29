import { createBrowserRouter } from "react-router-dom";
import Root from "../layout/Root";
import Landing from "../pages/Landing/Landing";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children:[
        {index:true, Component: Landing},
    ]
  },
]);
export default router;
