import { useAuth } from "../../context/AuthContext";
import DashboardCard01 from "../../Component/partials/dashboard/DashboardCard01.jsx";
import DashboardCard02 from "../../Component/partials/dashboard/DashboardCard02.jsx";
import DashboardCard03 from "../../Component/partials/dashboard/DashboardCard03.jsx";
import DashboardCard04 from "../../Component/partials/dashboard/DashboardCard04.jsx";
import DashboardCard05 from "../../Component/partials/dashboard/DashboardCard05.jsx";
import DashboardCard06 from "../../Component/partials/dashboard/DashboardCard06.jsx";
import DashboardCard08 from "../../Component/partials/dashboard/DashboardCard08.jsx";
import DashboardCard09 from "../../Component/partials/dashboard/DashboardCard09.jsx";
import DashboardCard10 from "../../Component/partials/dashboard/DashboardCard10.jsx";
import DashboardCard11 from "../../Component/partials/dashboard/DashboardCard11.jsx";
import DashboardCard12 from "../../Component/partials/dashboard/DashboardCard12.jsx";
import DashboardCard13 from "../../Component/partials/dashboard/DashboardCard13.jsx";
import FilterButton from "../../Component/dashboard/components/DropdownFilter.jsx";
import Datepicker from "../../Component/dashboard/components/Datepicker.jsx";
import { useState } from "react";
function Dashboard() {
  const { authState } = useAuth();
    const [dateRange, setDateRange] = useState([
    new Date("2026-06-01"),
    new Date("2026-06-15"),
  ]);
  const [startDate, endDate] = dateRange;

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">Loading...</h1>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">Unauthorized Access</h1>
      </div>
    );
  }

  return (
    <div className="sm:flex sm:justify-between sm:items-center mb-8">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        {/* Dashboard actions */}
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          {/* Left: Title */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
              Dashboard
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
            {/* Filter button */}
            <FilterButton align="right" />
            {/* Datepicker built with React Day Picker */}
            <Datepicker align="right"   selectsRange
      startDate={startDate}
      endDate={endDate}
      onChange={(update) => setDateRange(update)}
      isClearable/>
            {/* Add view button */}
            <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
              <svg
                className="fill-current shrink-0 xs:hidden"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
              </svg>
              <span className="max-xs:sr-only">Add View</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {(authState.role === "Admin" || authState.role === "User") && (
            <DashboardCard01 />
          )}

           {(authState.role === "Admin" || authState.role === "User") && (
  <DashboardCard02/>
)}

          <DashboardCard03 />

          <DashboardCard04 />

          <DashboardCard05 />

          <DashboardCard06 />

          <DashboardCard08 />

          <DashboardCard09 />

          <DashboardCard10 />

          <DashboardCard11 />

          <DashboardCard12 />

          <DashboardCard13 />
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
