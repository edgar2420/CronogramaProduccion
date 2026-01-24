import React from "react";
import { Send, FileEdit, CheckCircle, RefreshCw } from "lucide-react";
import type { EstadoSemana } from "@/features/schedule/types";

type Props = {
  onPublish?: () => void;
  canPublish?: boolean;
  weekStatus?: EstadoSemana;
  ordenesBorrador?: number;
  fechaRango?: string;
};

const AdminQuickActions: React.FC<Props> = ({
  onPublish,
  canPublish = true,
  weekStatus = "borrador",
  ordenesBorrador = 0,
  fechaRango = "",
}) => {
  const hasBorrador = ordenesBorrador > 0;
  const isPublished = weekStatus === "publicado" || weekStatus === "cerrado";

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-white rounded-2xl border shadow-sm">
      {/* Left side: Status */}
      <div className="flex items-center gap-3">
        {weekStatus === "borrador" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg">
            <FileEdit size={16} className="text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">BORRADOR</span>
          </div>
        )}
        {weekStatus === "publicado" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-300 rounded-lg">
            <CheckCircle size={16} className="text-emerald-600" />
            <span className="font-semibold text-emerald-800 text-sm">PUBLICADO</span>
          </div>
        )}

        {/* Order count info */}
        {hasBorrador && (
          <span className="text-sm text-gray-600">
            <span className="font-bold text-amber-600">{ordenesBorrador}</span> órdenes pendientes de publicar
          </span>
        )}

        {isPublished && !hasBorrador && (
          <span className="text-sm text-gray-500">
            Todas las órdenes están publicadas
          </span>
        )}
      </div>

      {/* Right side: Publish button */}
      <button
        onClick={onPublish}
        disabled={!canPublish || !hasBorrador}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md
          ${hasBorrador
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white hover:shadow-lg'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
        title={
          !hasBorrador
            ? "No hay órdenes pendientes de publicar"
            : isPublished
              ? "Publicar nuevas órdenes"
              : "Publicar todas las órdenes"
        }
      >
        {isPublished && hasBorrador ? (
          <>
            <RefreshCw size={16} />
            Actualizar Publicación
          </>
        ) : (
          <>
            <Send size={16} />
            Publicar Todo
          </>
        )}
      </button>
    </div>
  );
};

export default AdminQuickActions;


