import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import { useLunchApp } from "../context/LunchContext";

function DashboardLayout() {
  const { isRemoteLoading, syncError, authUser } = useLunchApp();

  return (
    <div className="app-shell">
      <NavBar />
      <main className="page-shell">
        {authUser && isRemoteLoading ? (
          <div className="sync-banner">Syncing data from Supabase...</div>
        ) : null}
        {authUser && syncError ? (
          <div className="sync-banner sync-banner-error">
            Supabase sync error: {syncError}
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
