import { HomeIcon, ClipboardListIcon, CurrencyDollarIcon, LogoutIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`h-screen bg-white shadow-md ${collapsed ? "w-16" : "w-64"} transition-all duration-300`}>
      <button onClick={() => setCollapsed(!collapsed)} className="p-2 focus:outline-none">
        {collapsed ? "☰" : "✖"}
      </button>
      <nav className="mt-4 space-y-4">
        <SidebarLink icon={HomeIcon} label="Dashboard" />
        <SidebarLink icon={ClipboardListIcon} label="Attendance" />
        <SidebarLink icon={CurrencyDollarIcon} label="Payroll" />
        <SidebarLink icon={LogoutIcon} label="Logout" />
      </nav>
    </div>
  );
};

const SidebarLink = ({ icon: Icon, label }) => (
  <div className="flex items-center space-x-3 p-3 hover:bg-gray-200 cursor-pointer">
    <Icon className="h-6 w-6 text-gray-600" />
    <span className="text-gray-800">{label}</span>
  </div>
);

export default Sidebar;
