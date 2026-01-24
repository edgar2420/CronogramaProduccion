import React from "react";
import { Users, Clock, GraduationCap } from "lucide-react"; 

interface SidebarProps {
  onOpenPersonal: () => void;
  onOpenHorarios: () => void;
  onOpenCapacitacion: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onOpenPersonal,
  onOpenHorarios,
  onOpenCapacitacion
}) => {
  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-gray-900 text-white flex flex-col p-4 shadow-xl z-50 space-y-3">

      <h2 className="text-lg font-semibold border-b border-gray-700 pb-3 mb-3">
        Menú
      </h2>

      <button
        className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 py-2 px-3 rounded transition-colors"
        onClick={onOpenPersonal}
      >
        <Users size={18} />
        <span>Personal</span>
      </button>

      <button
        className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 py-2 px-3 rounded transition-colors"
        onClick={onOpenHorarios}
      >
        <Clock size={18} />
        <span>Horarios</span>
      </button>

      <button
        className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 py-2 px-3 rounded transition-colors"
        onClick={onOpenCapacitacion}
      >
        <GraduationCap size={18} />
        <span>Capacitación</span>
      </button>

    </div>
  );
};

export default Sidebar;
