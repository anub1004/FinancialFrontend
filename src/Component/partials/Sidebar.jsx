import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import SidebarLinkGroup from "./SidebarLinkGroup";
import { useTour } from "../../tours/TourProvider";

const LockIcon = () => (
  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
      clipRule="evenodd"
    />
  </svg>
);

// Reusable animated accordion wrapper.
// Uses the CSS grid-rows trick so height:auto content can transition smoothly
// (regular max-height transitions either clip content or need a magic number).
const AnimatedSubmenu = ({ open, children }) => (
  <div className="lg:hidden lg:sidebar-expanded:block 2xl:block">
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <ul className="overflow-hidden pl-8 mt-1">{children}</ul>
    </div>
  </div>
);

const Chevron = ({ open }) => (
  <svg
    className={`w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500 transition-transform duration-300 ease-in-out ${
      open ? "rotate-180" : ""
    }`}
    viewBox="0 0 12 12"
  >
    <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
  </svg>
);

// Shared classes for submenu links so hover/active states animate consistently.
const subLinkClass = ({ isActive }) =>
  "flex items-center transition-all duration-150 truncate hover:translate-x-1 " +
  (isActive
    ? "text-violet-500"
    : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200");

function Sidebar({ sidebarOpen, setSidebarOpen, variant = "default" }) {
  const location = useLocation();
  const { pathname } = location;

  const { logout, authState } = useAuth();
  const { hasFeature, subscription } = useSubscription();
  const { restartTour } = useTour();

  const dashboardActive =
    pathname === "/" ||
    pathname.includes("dashboard") ||
    pathname.includes("main") ||
    pathname.includes("analytics");

  const reportActive = pathname.includes("report-generation");

  const financeActive =
    pathname.includes("finance") ||
    pathname.includes("cards") ||
    pathname.includes("transaction") ||
    pathname.includes("investment-monitoring") ||
    pathname.includes("reports-analytics") ||
    pathname.includes("security") ||
    pathname.includes("budget-planning") ||
    pathname.includes("portfolio-management") ||
    pathname.includes("tax-reports") ||
    pathname.includes("audit-log");

  const communityActive = pathname.includes("community");

  const settingsActive = pathname.includes("settings");

  const utilityActive =
    pathname.includes("utility") ||
    pathname.includes("roadmap") ||
    pathname.includes("faq");

  const adminActive = pathname.includes("admin");

  const accountsActive =
    pathname.includes("manage-accounts") ||
    pathname.includes("user-management");

  const canAccess = (key) => subscription.loading || hasFeature(key);

  const trigger = useRef(null);
  const sidebar = useRef(null);

  const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");

  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  // Drives a gentle fade/slide-in for the nav the first time the sidebar mounts.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded);
    const body = document.querySelector("body");
    if (!body) return;
    if (sidebarExpanded) {
      body.classList.add("sidebar-expanded");
    } else {
      body.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <div className="min-w-fit">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden lg:z-auto transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        id="sidebar"
        data-tour="sidebar"
        ref={sidebar}
        className={`flex lg:flex! flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:w-64! shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        } ${
          variant === "v2"
            ? "border-r border-gray-200 dark:border-gray-700/60"
            : "rounded-r-2xl shadow-xs"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          <button
            ref={trigger}
            className="lg:hidden text-gray-500 hover:text-gray-400 transition-colors duration-150"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>

          <NavLink end to="/" className="block group">
            <svg
              className="fill-violet-500 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-[8deg]"
              xmlns="http://www.w3.org/2000/svg"
              width={32}
              height={32}
            >
              <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
            </svg>
          </NavLink>
        </div>

        {/* Links */}
        <div
          className={`space-y-8 transition-all duration-500 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          <div>
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
              <span
                className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6"
                aria-hidden="true"
              >
                •••
              </span>
              <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                Pages
              </span>
            </h3>

            <ul className="mt-3">
              {/* Dashboard */}
              <SidebarLinkGroup activecondition={dashboardActive}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <a
                      href="#0"
                      className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${
                        dashboardActive ? "" : "hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick();
                        setSidebarExpanded(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <NavLink
                          to="/dashboard"
                          data-tour="dashboard-nav"
                          className="block text-gray-800 dark:text-gray-100"
                        >
                          <div className="flex items-center">
                            <svg
                              className={`shrink-0 fill-current transition-colors duration-200 ${
                                dashboardActive
                                  ? "text-violet-500"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                            >
                              <path d="M5.936.278A7.983 7.983 0 0 1 8 0a8 8 0 1 1-8 8c0-.722.104-1.413.278-2.064a1 1 0 1 1 1.932.516A5.99 5.99 0 0 0 2 8a6 6 0 1 0 6-6c-.53 0-1.045.076-1.548.21A1 1 0 1 1 5.936.278Z" />
                              <path d="M6.068 7.482A2.003 2.003 0 0 0 8 10a2 2 0 1 0-.518-3.932L3.707 2.293a1 1 0 0 0-1.414 1.414l3.775 3.775Z" />
                            </svg>
                            <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Dashboard
                            </span>
                          </div>
                        </NavLink>

                        <div className="flex shrink-0 ml-2">
                          <Chevron open={open} />
                        </div>
                      </div>
                    </a>

                    <AnimatedSubmenu open={open}>
                     

                      <li className="mb-1 last:mb-0">
                        {canAccess("analytics") ? (
                          <NavLink end to="/analytics" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Analytics
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Analytics
                            </span>
                          </NavLink>
                        )}
                      </li>
                    </AnimatedSubmenu>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* Report Generation */}
              <SidebarLinkGroup activecondition={reportActive}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <a
                      href="#0"
                      className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${
                        reportActive ? "" : "hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick();
                        setSidebarExpanded(true);
                      }}
                    >
                      <div
                        className="flex items-center justify-between"
                        data-tour="ReportGeneration"
                      >
                        <div className="flex items-center">
                          <svg
                            className={`shrink-0 fill-current transition-colors duration-200 ${
                              reportActive
                                ? "text-violet-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                          >
                            <path d="M9 6.855A3.502 3.502 0 0 0 8 0a3.5 3.5 0 0 0-1 6.855v1.656L5.534 9.65a3.5 3.5 0 1 0 1.229 1.578L8 10.267l1.238.962a3.5 3.5 0 1 0 1.229-1.578L9 8.511V6.855ZM6.5 3.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm4.803 8.095c.005-.005.01-.01.013-.016l.012-.016a1.5 1.5 0 1 1-.025.032ZM3.5 11c.474 0 .897.22 1.171.563l.013.016.013.017A1.5 1.5 0 1 1 3.5 11Z" />
                          </svg>

                          {canAccess("reports") ? (
                            <NavLink
                              to="/report-generation"
                              className="block text-gray-800 dark:text-gray-100"
                            >
                              <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                Report Generation
                              </span>
                            </NavLink>
                          ) : (
                            <NavLink to="/plans" className="block text-gray-400 dark:text-gray-500">
                              <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                                <LockIcon /> Report Generation
                              </span>
                            </NavLink>
                          )}
                        </div>
                      </div>
                    </a>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* Finance */}
              <SidebarLinkGroup activecondition={financeActive}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <a
                      href="#0"
                      className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${
                        financeActive ? "" : "hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick();
                        setSidebarExpanded(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className={`shrink-0 fill-current transition-colors duration-200 ${
                              financeActive
                                ? "text-violet-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                          >
                            <path d="M6 0a6 6 0 0 0-6 6c0 1.077.304 2.062.78 2.912a1 1 0 1 0 1.745-.976A3.945 3.945 0 0 1 2 6a4 4 0 0 1 4-4c.693 0 1.344.194 1.936.525A1 1 0 1 0 8.912.779 5.944 5.944 0 0 0 6 0Z" />
                            <path d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
                          </svg>
                          <span
                            className={`text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 transition-colors ${
                              financeActive ? "text-violet-500" : ""
                            }`}
                          >
                            Finance
                          </span>
                        </div>

                        <div className="flex shrink-0 ml-2">
                          <Chevron open={open} />
                        </div>
                      </div>
                    </a>

                    <AnimatedSubmenu open={open}>
                      {/* Cards */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("cards") ? (
                          <NavLink end to="/cards" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Cards
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Cards
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Transactions */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("transactions") ? (
                          <NavLink end to="/transaction" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Transactions
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Transactions
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Transaction Details */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("transactions") ? (
                          <NavLink end to="/transaction-details" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Transaction Details
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Transaction Details
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Transactions Oversight */}
                      <li className="mb-1 last:mb-0">
                        <NavLink end to="/transactions" className={subLinkClass}>
                          <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                            Transactions Oversight
                          </span>
                        </NavLink>
                      </li>

                      {/* Investment Monitoring */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("investment_tracking") ? (
                          <NavLink end to="/investment-monitoring" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Investment Monitoring
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Investment Monitoring
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Reports & Analytics */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("reports") ? (
                          <NavLink end to="/reports-analytics" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Reports & Analytics
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Reports & Analytics
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Security & Audit */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("security_settings") ? (
                          <NavLink end to="/security" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Security & Audit
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Security & Audit
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Budget Planning */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("budget_planning") ? (
                          <NavLink end to="/budget-planning" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Budget Planning
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Budget Planning
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Portfolio */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("portfolio_management") ? (
                          <NavLink end to="/portfolio-management" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Portfolio
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Portfolio
                            </span>
                          </NavLink>
                        )}
                      </li>
                      <li className="mb-1 last:mb-0">
                        {canAccess("portfolio_management") ? (
                          <NavLink end to="/goals" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Goals
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/goals"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Goals
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Tax Reports */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("tax_reports") ? (
                          <NavLink end to="/tax-reports" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Tax Reports
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Tax Reports
                            </span>
                          </NavLink>
                        )}
                      </li>

                      {/* Audit Log */}
                      <li className="mb-1 last:mb-0">
                        {canAccess("audit_log") ? (
                          <NavLink end to="/audit-log" className={subLinkClass}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              Audit Log
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            end
                            to="/plans"
                            className="flex items-center transition-all duration-150 truncate text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 flex items-center gap-1.5">
                              <LockIcon /> Audit Log
                            </span>
                          </NavLink>
                        )}
                      </li>
                    </AnimatedSubmenu>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* Community */}
              <SidebarLinkGroup activecondition={communityActive}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <a
                      href="#0"
                      className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${
                        communityActive ? "" : "hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick();
                        setSidebarExpanded(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className={`shrink-0 fill-current transition-colors duration-200 ${
                              communityActive
                                ? "text-violet-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                          >
                            <path d="M12 1a1 1 0 1 0-2 0v2a3 3 0 0 0 3 3h2a1 1 0 1 0 0-2h-2a1 1 0 0 1-1-1V1ZM1 10a1 1 0 1 0 0 2h2a1 1 0 0 1 1 1v2a1 1 0 0 0 2 0v-2a3 3 0 0 0-3-3H1ZM5 0a1 1 0 0 1 1 1v2a3 3 0 0 1-3 3H1a1 1 0 0 1 0-2h2a1 1 0 0 0 1-1V1a1 1 0 0 1 1-1ZM12 13a1 1 0 0 1 1-1h2a1 1 0 1 0 0-2h-2a3 3 0 0 0-3 3v2a1 1 0 1 0 2 0v-2Z" />
                          </svg>
                          <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                            Community
                          </span>
                        </div>
                        <div className="flex shrink-0 ml-2">
                          <Chevron open={open} />
                        </div>
                      </div>
                    </a>

                    <AnimatedSubmenu open={open}>
                      {["Profile", , "Forum", "Forum - Post"].map(
                        (item) => (
                          <li key={item} className="mb-1 last:mb-0">
                            <NavLink end to="https://cruip.com/mosaic/" className={subLinkClass}>
                              <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                {item}
                              </span>
                            </NavLink>
                          </li>
                        )
                      )}
                    </AnimatedSubmenu>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* ============================================
                  SETTINGS
                  ============================================ */}

              <SidebarLinkGroup activecondition={settingsActive}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <NavLink
                      end
                      to="/settings"
                      className={({ isActive }) =>
                        `block w-full truncate transition-colors duration-150 ${
                          isActive
                            ? "text-violet-500"
                            : "text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white"
                        }`
                      }
                    >
                      <div className="flex items-center w-full" data-tour="Settings">
                        <svg
                          className={`shrink-0 fill-current transition-colors duration-200 ${
                            settingsActive ? "text-violet-500" : "text-gray-400 dark:text-gray-500"
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                        >
                          <path
                            d="M10.5 1a3.502 3.502 0 0 1 3.355 2.5H15a1 1 0 1 1 0 2h-1.145a3.502 3.502 0 0 1-6.71 0H1a1 1 0 0 1 0-2h6.145A3.502 3.502 0 0 1 10.5 1ZM9 4.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM5.5 9a3.502 3.502 0 0 1 3.355 2.5H15a1 1 0 1 1 0 2H8.855a3.502 3.502 0 0 1-6.71 0H1a1 1 0 1 1 0-2h1.145A3.502 3.502 0 0 1 5.5 9ZM4 12.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z"
                            fillRule="evenodd"
                          />
                        </svg>
                        <span
                          className={`text-sm font-medium ml-4 duration-200 transition-colors ${
                            settingsActive ? "text-violet-500" : "text-gray-800 dark:text-gray-100"
                          } lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100`}
                        >
                          Account Setting
                        </span>
                      </div>
                    </NavLink>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {/* Utility */}
              <SidebarLinkGroup activecondition={utilityActive}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <a
                      href="#0"
                      className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${
                        utilityActive ? "" : "hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick();
                        setSidebarExpanded(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className={`shrink-0 fill-current transition-colors duration-200 ${
                              utilityActive
                                ? "text-violet-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                          >
                            <path d="M14.75 2.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM14.75 16a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM2.5 14.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0ZM1.25 2.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
                            <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2ZM4 8a4 4 0 1 1 8 0A4 4 0 0 1 4 8Z" />
                          </svg>
                          <span
                            className={`text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 transition-colors ${
                              utilityActive ? "text-violet-500" : ""
                            }`}
                          >
                            Utility
                          </span>
                        </div>
                        <div className="flex shrink-0 ml-2">
                          <Chevron open={open} />
                        </div>
                      </div>
                    </a>

                    <AnimatedSubmenu open={open}>
                      <li className="mb-1 last:mb-0">
                        <NavLink end to="https://cruip.com/mosaic/" className={subLinkClass}>
                          <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                            Changelog
                          </span>
                        </NavLink>
                      </li>
                      <li className="mb-1 last:mb-0">
                        <NavLink end to="/roadmap" className={subLinkClass}>
                          <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                            Roadmap
                          </span>
                        </NavLink>
                      </li>
                      <li className="mb-1 last:mb-0">
                        <NavLink end to="/faq" className={subLinkClass}>
                          <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                            FAQs & Help
                          </span>
                        </NavLink>
                      </li>
                    </AnimatedSubmenu>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
              <span
                className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6"
                aria-hidden="true"
              >
                •••
              </span>
              <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">More</span>
            </h3>

            <ul className="mt-3">
              <SidebarLinkGroup>
                {(handleClick, open) => (
                  <React.Fragment>
                    <a
                      href="#0"
                      data-tour="onboarding-nav-group"
                      className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${
                        open ? "" : "hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick();
                        setSidebarExpanded(true);
                      }}
                    >
                      <div
                        className="flex items-center justify-between"
                        data-tour="onboarding-nav-link"
                      >
                        <div className="flex items-center">
                          <svg
                            className="shrink-0 fill-current text-gray-400 dark:text-gray-500 transition-colors duration-200"
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                          >
                            <path d="M6.668.714a1 1 0 0 1-.673 1.244 6.014 6.014 0 0 0-4.037 4.037 1 1 0 1 1-1.916-.571A8.014 8.014 0 0 1 5.425.041a1 1 0 0 1 1.243.673ZM7.71 4.709a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM9.995.04a1 1 0 1 0-.57 1.918 6.014 6.014 0 0 1 4.036 4.037 1 1 0 0 0 1.917-.571A8.014 8.014 0 0 0 9.995.041ZM14.705 8.75a1 1 0 0 1 .673 1.244 8.014 8.014 0 0 1-5.383 5.384 1 1 0 0 1-.57-1.917 6.014 6.014 0 0 0 4.036-4.037 1 1 0 0 1 1.244-.673ZM1.958 9.424a1 1 0 0 0-1.916.57 8.014 8.014 0 0 0 5.383 5.384 1 1 0 0 0 .57-1.917 6.014 6.014 0 0 1-4.037-4.037Z" />
                          </svg>
                          <NavLink
                            to="/onboarding"
                            className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200"
                          >
                            <span className="text-sm font-medium ml-4">Onboarding</span>
                          </NavLink>
                        </div>
                      </div>
                    </a>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>

              {authState?.role?.toLowerCase() === "admin" && (
                <SidebarLinkGroup activecondition={adminActive}>
                  {(handleClick, open) => (
                    <React.Fragment>
                      <NavLink
                        to="/admin"
                        className={`block truncate transition-colors duration-150 ${
                          adminActive
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        onClick={() => {
                          handleClick();
                          setSidebarExpanded(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg
                              className={`shrink-0 fill-current transition-colors duration-200 ${
                                adminActive ? "text-violet-500" : "text-gray-400 dark:text-gray-500"
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                            >
                              <path d="M8 0a1 1 0 0 1 1 1v1.07A6.006 6.006 0 0 1 13.93 7H15a1 1 0 1 1 0 2h-1.07A6.006 6.006 0 0 1 9 13.93V15a1 1 0 1 1-2 0v-1.07A6.006 6.006 0 0 1 2.07 9H1a1 1 0 0 1 0-2h1.07A6.006 6.006 0 0 1 7 2.07V1a1 1 0 0 1 1-1Zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
                            </svg>
                            <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 transition-opacity duration-200">
                              Admin
                            </span>
                          </div>
                        </div>
                      </NavLink>
                    </React.Fragment>
                  )}
                </SidebarLinkGroup>
              )}

              <li className="mt-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    restartTour("default");
                  }}
                  data-tour="tour-restart"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300 cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm shrink-0">
                    <span className="absolute inset-0 rounded-lg bg-white/30 opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="relative group-hover:scale-110 transition-transform duration-200"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 whitespace-nowrap">
                    Take Tour
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-auto lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 group-hover:translate-x-1 transition-transform"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Expand / Collapse */}
        <div className="pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto">
          <div className="w-12 pl-4 pr-3 py-2">
            <button
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
            >
              <span className="sr-only">Expand / collapse sidebar</span>
              <svg
                className="shrink-0 fill-current text-gray-400 dark:text-gray-500 transition-transform duration-300 ease-in-out sidebar-expanded:rotate-180"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path d="M15 16a1 1 0 0 1-1-1V1a1 1 0 1 1 2 0v14a1 1 0 0 1-1 1ZM8.586 7H1a1 1 0 1 0 0 2h7.586l-2.793 2.793a1 1 0 1 0 1.414 1.414l4.5-4.5A.997.997 0 0 0 12 8.01M11.924 7.617a.997.997 0 0 0-.217-.324l-4.5-4.5a1 1 0 0 0-1.414 1.414L8.586 7M12 7.99a.996.996 0 0 0-.076-.373Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;