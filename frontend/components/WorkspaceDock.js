"use client";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function WorkspaceDock({
  onOpenSettings,
  variant = "page",
}) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return null;
  }

  return (
    <div
      className={`workspace-corner-dock ${
        variant === "sidebar"
          ? "workspace-corner-dock-sidebar"
          : "workspace-corner-dock-page"
      }`}
    >
      <button
        type="button"
        onClick={onOpenSettings}
        className="workspace-corner-button"
      >
        <span className="workspace-corner-avatar">
          {(user.name || "U").slice(0, 1).toUpperCase()}
        </span>
        <span className="workspace-corner-copy">
          <strong>Account & Settings</strong>
          <span>{user.role === "admin" ? "Profile, tools, security" : "Profile and security"}</span>
        </span>
      </button>
    </div>
  );
}
