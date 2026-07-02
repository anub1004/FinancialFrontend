import { useState } from "react";
import Header from "./Component/partials/Header.jsx";
import Sidebar from "./Component/partials/Sidebar.jsx";
import { Outlet } from "react-router-dom";
function MainLayout(){
        const [sidebarOpen, setSidebarOpen] = useState(false);
    return <>
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div id="main-content" className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* Main */}
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
          <Outlet />
            </div>
        </main>
      </div>
    </div>
    </>
}
export default MainLayout;
