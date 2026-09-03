import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  nombre?: string;
  imageSrc: string;
};

const WelcomeJoseLuisModal: React.FC<Props> = ({ open, onClose, nombre = "José Luis", imageSrc }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-5 py-3 border-b bg-sky-50 text-sky-900 font-bold">
            ¡Bienvenido, {nombre}!
          </div>

          <div className="p-4">
            <div className="rounded-xl overflow-hidden border bg-gray-50">

              <img
                src={imageSrc}
                alt="Bienvenida"
                className="w-full h-80 object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            </div>
            <p className="mt-3 text-sm text-gray-700 text-center">
              ¡JAJAJAJA!
            </p>
          </div>

          <div className="px-5 py-3 border-t flex justify-end">
            <button className="btn bg-sky-600 hover:bg-sky-700 text-white" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeJoseLuisModal;
