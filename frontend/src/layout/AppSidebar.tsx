// import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BoltIcon,
  CalenderIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PlugInIcon,
  UserCircleIcon,
  CreditCardIcon,
  UsersIcon,
  BuildingIcon,
  FuelIcon,
  ClockIcon,
  ReportIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  subItems?: { name: string; path: string; icon?: React.ReactNode }[];
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { authUser, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Role-based menu for super admin
  const superAdminMenu: NavItem[] = [
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
      path: "/super-admin/clients",
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
      name: "Log out",
      onClick: logout,
    },
  ];

  // Role-based menu for fuel-admin with new IA structure
  const fuelAdminMenu: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/fuel-admin-dashboard",
    },
    {
      icon: <CogIcon />,
      name: "Configuration Hub",
      subItems: [
        {
          name: "Station Setup",
          path: "/fuel-admin/configuration/station-setup",
          icon: <BuildingIcon />,
        },
        {
          name: "Product Master",
          path: "/fuel-admin/configuration/product-master",
          icon: <FuelIcon />,
        },
        {
          name: "Staff & Shifts",
          path: "/fuel-admin/configuration/staff-shifts",
          icon: <UsersIcon />,
        },
      ],
    },
    {
      icon: <ClockIcon />,
      name: "Daily Operations",
      subItems: [
        {
          name: "Today's Setup",
          path: "/fuel-admin/operations/today-setup",
          icon: <GridIcon />,
        },
        {
          name: "Live Monitoring",
          path: "/fuel-admin/operations/live-monitoring",
          icon: <BoltIcon />,
        },
        {
          name: "End of Day",
          path: "/fuel-admin/operations/end-of-day",
          icon: <CalenderIcon />,
        },
      ],
    },
    {
      icon: <ReportIcon />,
      name: "Reports & Analytics",
      path: "/fuel-admin/reports",
    },
    {
      icon: <CreditCardIcon />,
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
      name: "Log out",
      onClick: logout,
    },
  ];

  // Role-based menu for partner
  const partnerMenu: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/partner-dashboard",
    },
    {
      icon: <BoltIcon />,
      name: "Fuel Request",
      path: "/partner/fuel-request",
    },
    {
      icon: <ListIcon />,
      name: "Request History",
      path: "/partner/request-history",
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
  const isSubItemActive = (subItems?: NavItem["subItems"]) => {
    if (!subItems) return false;
    return subItems.some((item) => isActive(item.path));
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemExpanded = (itemName: string) => {
    return (
      expandedItems.includes(itemName) ||
      isSubItemActive(
        menuToShow.find((item) => item.name === itemName)?.subItems
      )
    );
  };

  const renderMenuItem = (item: NavItem) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isSubActive = isSubItemActive(item.subItems);
    const showSubItems =
      (isExpanded || isHovered || isMobileOpen) && isItemExpanded(item.name);

    return (
      <li key={item.name}>
        {hasSubItems ? (
          <button
            className={`menu-item group w-full text-left ${
              isSubActive ? "menu-item-active" : "menu-item-inactive"
            }`}
            onClick={() => toggleExpanded(item.name)}
          >
            <span className="menu-item-icon-size">{item.icon}</span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <>
                <span className="menu-item-text">{item.name}</span>
                <span className="ml-auto">
                  {isItemExpanded(item.name) ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </span>
              </>
            )}
          </button>
        ) : item.path ? (
          <Link
            to={item.path}
            className={`menu-item group ${
              isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
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

        {/* Render sub-items */}
        {hasSubItems && showSubItems && (
          <ul className="ml-6 mt-2 space-y-1">
            {item.subItems!.map((subItem) => (
              <li key={subItem.name}>
                <Link
                  to={subItem.path}
                  className={`menu-item group text-sm ${
                    isActive(subItem.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span className="menu-item-icon-size">
                    {subItem.icon || <ListIcon />}
                  </span>
                  <span className="menu-item-text">{subItem.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

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
        <Link
          to={
            authUser?.role === "super_admin"
              ? "/super-admin-dashboard"
              : authUser?.role === "fuel-admin"
                ? "/fuel-admin-dashboard"
                : authUser?.role === "partner"
                  ? "/partner-dashboard"
                  : "/"
          }
        >
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
                {menuToShow.map(renderMenuItem)}
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
