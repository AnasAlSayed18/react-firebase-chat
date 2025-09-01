import { useEffect, useRef } from "react";
import "./MessageList.css";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatMessageDate(ts) {
  if (!ts) return "";
  const date = ts instanceof Date ? ts : new Date(ts);

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return "Today";

  const dayName = dayNames[date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${dayName} ${month}/${day}/${year}`;
}

export default function MessageList({ messages = [] }) {
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // Scroll to bottom automatically
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Group messages by day
  const grouped = [];
  let lastDay = null;

  messages.forEach((m) => {
    const dayLabel = formatMessageDate(m.createdAt || new Date());
    if (dayLabel !== lastDay) {
      grouped.push({ type: "day", label: dayLabel });
      lastDay = dayLabel;
    }
    grouped.push({ type: "msg", data: m });
  });

  const displayList = [...grouped].reverse();

  return (
    <div className="ml" ref={listRef}>
      {displayList.map((item, idx) =>
        item.type === "day" ? (
          <div key={`day-${idx}`} className="ml-day">
            {item.label}
          </div>
        ) : (
          <div key={item.data.id} className={`ml-row ${item.data.me ? "me" : "other"}`}>
            <div className="ml-bubble">
              <span>{item.data.text}</span>
              <time>{item.data.time}</time>
            </div>
          </div>
        )
      )}
    </div>
  );
}
