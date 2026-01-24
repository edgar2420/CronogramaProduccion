import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarView = "semana" | "mes";

type Props = {
  value: Date;
  view: CalendarView;
  onViewChange?: (v: CalendarView) => void;
  onChange?: (d: Date) => void;
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const MiniCalendar: React.FC<Props> = ({ value, view, onViewChange, onChange }) => {
  const month = value.getMonth();
  const year = value.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const firstShown = startOfWeek(firstDayOfMonth);
  const cells = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(firstShown, i)), [year, month]);

  function prev() {
    const step = view === "mes" ? -1 : -7;
    onChange?.(addDays(value, step));
  }
  function next() {
    const step = view === "mes" ? 30 : 7;
    onChange?.(addDays(value, step));
  } 1

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="font-semibold">
          {value.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn h-8 px-2" onClick={prev}><ChevronLeft size={16} /></button>
          <button className="btn h-8 px-2" onClick={next}><ChevronRight size={16} /></button>
          <select
            className="input h-8"
            value={view}
            onChange={(e) => onViewChange?.(e.target.value as CalendarView)}
          >
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 p-2 text-xs text-gray-500">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
        {cells.map((d) => {
          const isToday = d.toDateString() === new Date().toDateString();
          const isCurrentMonth = d.getMonth() === month;
          return (
            <button
              key={d.toISOString()}
              className={`rounded-md py-2 text-center transition
                ${isCurrentMonth ? "text-blue-900" : "text-gray-400"}
                ${isToday ? "bg-yellow-100" : "hover:bg-blue-50"}`}
              onClick={() => onChange?.(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;

