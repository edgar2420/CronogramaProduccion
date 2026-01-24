import React from "react";

type Props = React.PropsWithChildren<{
  title?: string;
  right?: React.ReactNode;
  className?: string;
}>;

const Section: React.FC<Props> = ({ title, right, className, children }) => {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow ${className ?? ""}`}
    >
      {/* Encabezado opcional */}
      {(title || right) && (
        <header className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3 rounded-t-2xl">
          {title && (
            <h2 className="text-base font-semibold text-blue-900 tracking-tight">
              {title}
            </h2>
          )}
          {right && <div className="ml-auto">{right}</div>}
        </header>
      )}

      {/* Contenido */}
      <div className="p-5">{children}</div>
    </section>
  );
};

export default Section;
