import React from "react";
import {
  UsersRound, UserPlus, Search, PackageOpen, Upload, BookOpenText
} from "lucide-react";

type Props = {
  asignados: number;
  disponibles: number;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGestionCatalogo?: () => void;
  onBuscarPersonal?: (term: string) => void;
  onBuscarProducto?: (term: string) => void;
};

const ControlPanel: React.FC<Props> = ({
  asignados,
  disponibles,
  onImportExcel,
  onGestionCatalogo,
  onBuscarPersonal,
  onBuscarProducto,
}) => {
  return (
    <aside className="w-full lg:w-[320px] xl:w-[360px]">
      <div className="rounded-2xl border bg-white shadow-sm p-4">
        <h2 className="text-lg font-bold text-blue-900">Panel de control</h2>
        <div className="mt-3 h-[2px] bg-blue-100 rounded" />

        {/* KPIs */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
            <div className="flex items-center gap-2 text-blue-900">
              <UsersRound size={18} /><span className="text-sm">Asignados</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-blue-900">{asignados}</div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <UserPlus size={18} /><span className="text-sm">Disponibles</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-700">{disponibles}</div>
          </div>
        </div>

        {/* buscar personal */}
        <div className="mt-4">
          <label className="label">Buscar personal</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="input pl-9"
              placeholder="Nombre o código..."
              onChange={(e)=>onBuscarPersonal?.(e.target.value)}
            />
          </div>
        </div>

        {/* buscar producto */}
        <div className="mt-3">
          <label className="label">Buscar producto</label>
          <div className="relative">
            <PackageOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="input pl-9"
              placeholder="Código o nombre del producto..."
              onChange={(e)=>onBuscarProducto?.(e.target.value)}
            />
          </div>
        </div>

        {/* acciones */}
        <div className="mt-4 grid gap-2">
          <button
            className="btn bg-blue-50 hover:bg-blue-100 text-blue-900 justify-start"
            onClick={onGestionCatalogo}
            type="button"
          >
            <BookOpenText size={18}/> Gestionar catálogo
          </button>

          <label className="btn bg-gray-900 hover:bg-black text-white justify-start cursor-pointer">
            <Upload size={18}/> Importar Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportExcel}/>
          </label>
        </div>
      </div>
    </aside>
  );
};

export default ControlPanel;
