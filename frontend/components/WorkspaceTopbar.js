"use client";

import { useEffect, useState } from "react";

export default function WorkspaceTopbar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const timeLabel = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateLabel = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="workspace-topbar">
      <div className="workspace-topbar-right">
        <span className="workspace-live-time">{timeLabel}</span>
        <span className="workspace-live-date">{dateLabel}</span>
      </div>
    </div>
  );
}
