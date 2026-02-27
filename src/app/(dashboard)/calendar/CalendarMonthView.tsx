"use client";

import { useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
};

type CalendarMonthViewProps = {
  events: CalendarEvent[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildDays(month: Date) {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const startOffset = first.getDay();
  const totalDays = last.getDate();
  const days: Date[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    days.push(new Date(first.getFullYear(), first.getMonth(), i - startOffset + 1));
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(first.getFullYear(), first.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    const nextDay = new Date(
      last.getFullYear(),
      last.getMonth(),
      last.getDate() + (days.length - (startOffset + totalDays)) + 1
    );
    days.push(nextDay);
  }

  return days;
}

function eventMatchesDay(event: CalendarEvent, day: Date) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  if (!end) {
    return isSameDay(start, day);
  }

  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
  return start <= dayEnd && end >= dayStart;
}

export default function CalendarMonthView({ events }: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => buildDays(currentMonth), [currentMonth]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) {
      const key = toDateKey(day);
      map.set(
        key,
        events.filter((event) => eventMatchesDay(event, day))
      );
    }
    return map;
  }, [days, events]);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  function handleEventClick(eventId: string) {
    const target = document.getElementById(`event-${eventId}`);
    if (target) {
      document
        .querySelectorAll(".calendar-flash")
        .forEach((element) => element.classList.remove("calendar-flash", "bg-sky-50", "ring-2", "ring-sky-200"));
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("calendar-flash", "bg-sky-100", "ring-4", "ring-sky-300");
      window.setTimeout(() => {
        target.classList.add("calendar-flash-out");
      }, 600);
      window.setTimeout(() => {
        target.classList.remove(
          "calendar-flash",
          "calendar-flash-out",
          "bg-sky-100",
          "ring-4",
          "ring-sky-300"
        );
      }, 2600);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Calendar view</h2>
          <p className="mt-1 text-xs text-slate-500">
            {monthLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Today
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          >
            Next
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-3 py-2 font-medium uppercase tracking-wide">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayKey = toDateKey(day);
          const dayEvents = eventsByDay.get(dayKey) ?? [];
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={dayKey}
              className={`min-h-[110px] border-b border-r border-slate-100 px-3 py-2 ${
                isCurrentMonth ? "bg-white" : "bg-slate-50 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    isToday ? "rounded-full bg-slate-900 px-2 py-0.5 text-white" : ""
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 ? (
                  <span className="text-[10px] text-slate-400">
                    {dayEvents.length}
                  </span>
                ) : null}
              </div>
              <ul className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      className="w-full truncate rounded bg-slate-100 px-2 py-1 text-left text-[11px] text-slate-700 hover:bg-slate-200"
                      title={event.title}
                      onClick={() => handleEventClick(event.id)}
                    >
                      {event.title}
                    </button>
                  </li>
                ))}
                {dayEvents.length > 2 ? (
                  <li className="text-[10px] text-slate-400">
                    +{dayEvents.length - 2} more
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
