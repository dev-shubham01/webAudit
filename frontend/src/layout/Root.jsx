import { Suspense } from "react";
import { Outlet,useLocation } from "react-router-dom"
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function PageLoadingFallback() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[#6366F1]" />
    </div>
  );
}

const Root=()=>{
    const location=useLocation();
    const isLoading=location.pathname==='/';

    if(isLoading) return <Suspense fallback={<PageLoadingFallback />}><Outlet/></Suspense>;
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 scroll-smooth overflow-y-auto p-8">
            <div className="mx-auto max-w-[1440px]">
              <Suspense fallback={<PageLoadingFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    );
}

export default Root;