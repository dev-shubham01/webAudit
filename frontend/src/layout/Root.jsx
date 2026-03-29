import { Outlet,useLocation } from "react-router-dom"
const Root=()=>{
    const location=useLocation();
    const isLoading=location.pathname==='/';

    if(isLoading) return <Outlet/>;
    return (
        <div>

        </div>
    )
}

export default Root;