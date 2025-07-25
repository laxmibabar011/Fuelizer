// import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  // BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  // PageIcon,
  // PieChartIcon,
  PlugInIcon,
  // TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../context/AuthContext";

// type NavItem = {
//   name: string;
//   icon: React.ReactNode;
//   path?: string;
//   subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
// };

// const navItems: NavItem[] = [
//   {
//     icon: <GridIcon />,
//     name: "Dashboard",
//     subItems: [{ name: "Ecommerce", path: "/", pro: false }],
//   },
//   {
//     icon: <CalenderIcon />,
//     name: "Calendar",
//     path: "/calendar",
//   },
//   {
//     icon: <UserCircleIcon />,
//     name: "User Profile",
//     path: "/profile",
//   },
//   {
//     name: "Forms",
//     icon: <ListIcon />,
//     subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
//   },
//   {
//     name: "Tables",
//     icon: <TableIcon />,
//     subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
//   },
//   {
//     name: "Pages",
//     icon: <PageIcon />,
//     subItems: [
//       { name: "Blank Page", path: "/blank", pro: false },
//       { name: "404 Error", path: "/error-404", pro: false },
//     ],
//   },
// ];

// const othersItems: NavItem[] = [
//   {
//     icon: <PieChartIcon />,
//     name: "Charts",
//     subItems: [
//       { name: "Line Chart", path: "/line-chart", pro: false },
//       { name: "Bar Chart", path: "/bar-chart", pro: false },
//     ],
//   },
//   {
//     icon: <BoxCubeIcon />,
//     name: "UI Elements",
//     subItems: [
//       { name: "Alerts", path: "/alerts", pro: false },
//       { name: "Avatar", path: "/avatars", pro: false },
//       { name: "Badge", path: "/badge", pro: false },
//       { name: "Buttons", path: "/buttons", pro: false },
//       { name: "Images", path: "/images", pro: false },
//       { name: "Videos", path: "/videos", pro: false },
//     ],
//   },
//   {
//     icon: <PlugInIcon />,
//     name: "Authentication",
//     subItems: [{ name: "Sign In", path: "/signin", pro: false }],
//   },
// ];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { authUser, logout } = useAuth();

  // Role-based menu for super admin
  const superAdminMenu = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/super-admin-dashboard",
    },
    {
      icon: <UserCircleIcon />,
      name: "Create Client",
      path: "/super-admin/create-client",
    },
    {
      icon: <ListIcon />,
      name: "Client List",
      path: "/super-admin/clients", // Placeholder, implement route later
    },
    {
      icon: <UserCircleIcon />,
      name: "Profile",
      path: "/profile",
    },
    {
      icon: <CalenderIcon />,
      name: "Calendar",
      path: "/calendar",
    },
    {
      icon: <PlugInIcon />,
      name: "Logout",
      onClick: logout,
    },
  ];

  // Role-based menu for fuel-admin
  const fuelAdminMenu = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/fuel-admin-dashboard",
    },
    {
      icon: <UserCircleIcon />,
      name: "Credit Management",
      path: "/fuel-admin/credit",
    },
    {
      icon: <UserCircleIcon />,
      name: "Profile",
      path: "/fuel-admin/profile",
    },
    {
      icon: <PlugInIcon />,
      name: "Logout",
      onClick: logout,
    },

  ];

  // Role-based menu for partner
  const partnerMenu = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/partner-dashboard",
    },
    {
      icon: <UserCircleIcon />,
      name: "Profile",
      path: "/partner/profile",
    },
    {
      icon: <PlugInIcon />,
      name: "Logout",
      onClick: logout,
    },
   
  ];

  const menuToShow =
    authUser?.role === "super_admin"
      ? superAdminMenu
      : authUser?.role === "fuel-admin"
        ? fuelAdminMenu
        : authUser?.role === "partner"
          ? partnerMenu
          : [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              <ul className="flex flex-col gap-4">
                {menuToShow.map((item) => (
                  <li key={item.name}>
                    {item.path ? (
                      <Link
                        to={item.path}
                        className={`menu-item group ${
                          isActive(item.path)
                            ? "menu-item-active"
                            : "menu-item-inactive"
                        }`}
                      >
                        <span className="menu-item-icon-size">{item.icon}</span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <span className="menu-item-text">{item.name}</span>
                        )}
                      </Link>
                    ) : (
                      <button
                        className="menu-item group menu-item-inactive w-full text-left"
                        onClick={item.onClick}
                      >
                        <span className="menu-item-icon-size">{item.icon}</span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <span className="menu-item-text">{item.name}</span>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
