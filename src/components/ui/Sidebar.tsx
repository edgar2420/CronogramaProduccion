import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Users } from "lucide-react";

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:block w-64 border-r bg-white">
      <div className="p-4 font-bold">Menú</div>
      <nav className="px-2 space-y-1">
        <NavLink to="/" className={({isActive})=>`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 ${isActive?"bg-gray-100 font-semibold":""}`}>
          <LayoutGrid size={18}/> Dashboard
        </NavLink>
        <NavLink to="/admin/staff" className={({isActive})=>`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 ${isActive?"bg-gray-100 font-semibold":""}`}>
          <Users size={18}/> Personal
        </NavLink>
      </nav>
    </aside>
  );
};
export default Sidebar;
