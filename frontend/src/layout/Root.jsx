import { Outlet,useLocation } from "react-router-dom"
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";  
const Root=()=>{
    const location=useLocation();
    const isLoading=location.pathname==='/';

    if(isLoading) return <Outlet/>;
    return (
      <div className="flex h-screen bg-[#0F172A]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 scroll-smooth overflow-y-auto p-8">
            <div className="mx-auto max-w-[1440px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
}

export default Root;