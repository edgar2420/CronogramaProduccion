import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

interface FloatingCalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

const FloatingCalendar: React.FC<FloatingCalendarProps> = ({
    selectedDate,
    onSelectDate,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(dayjs(selectedDate));

    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfMonth = viewDate.startOf("month").day();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const prevMonth = () => setViewDate(viewDate.subtract(1, "month"));
    const nextMonth = () => setViewDate(viewDate.add(1, "month"));

    const handleDayClick = (day: number) => {
        const newDate = viewDate.date(day).toDate();
        onSelectDate(newDate);
        setIsOpen(false);
    };

    const isToday = (day: number) => {
        const today = dayjs();
        return (
            viewDate.year() === today.year() &&
            viewDate.month() === today.month() &&
            day === today.date()
        );
    };

    const isSelected = (day: number) => {
        const sel = dayjs(selectedDate);
        return (
            viewDate.year() === sel.year() &&
            viewDate.month() === sel.month() &&
            day === sel.date()
        );
    };

    const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-br from-primary-500 to-primary-700 text-white px-4 py-3 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
                <Calendar size={20} />
                <span className="font-semibold text-sm">Calendario</span>
            </button>

            {/* Calendar Modal */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Calendar Panel */}
                    <div className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-[320px] animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={prevMonth}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <ChevronLeft size={18} className="text-gray-600" />
                            </button>

                            <h3 className="text-lg font-bold text-gray-900 capitalize">
                                {viewDate.format("MMMM YYYY")}
                            </h3>

                            <button
                                onClick={nextMonth}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <ChevronRight size={18} className="text-gray-600" />
                            </button>
                        </div>


                        <div className="flex gap-1 mb-4 overflow-x-auto hide-scrollbar pb-2">
                            {Array.from({ length: 12 }, (_, i) => {
                                const monthDate = dayjs().month(i);
                                const isCurrentViewMonth = viewDate.month() === i && viewDate.year() === dayjs().year();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setViewDate(dayjs().month(i))}
                                        className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${isCurrentViewMonth
                                            ? "bg-primary-500 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {monthDate.format("MMM")}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Week Days Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-xs font-bold text-gray-400 uppercase py-1"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for days before first of month */}
                            {Array.from({ length: adjustedFirstDay }, (_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {/* Day cells */}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDayClick(day)}
                                        className={`
                      aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                      ${isSelected(day)
                                                ? "bg-primary-500 text-white shadow-md"
                                                : isToday(day)
                                                    ? "bg-primary-100 text-primary-700 ring-2 ring-primary-300"
                                                    : "hover:bg-gray-100 text-gray-700"
                                            }
                    `}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    onSelectDate(new Date());
                                    setViewDate(dayjs());
                                    setIsOpen(false);
                                }}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                Ir a hoy
                            </button>
                            <span className="text-xs text-gray-400">
                                Semana seleccionada: {dayjs(selectedDate).format("DD MMM")}
                            </span>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default FloatingCalendar;
