import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import supabase from "../helper/supabaseClient";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const getClassName = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="brand">KhajaExpense</div>
        <button
          type="button"
          className="nav-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="main-nav-actions"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>
      <div
        id="main-nav-actions"
        className={`nav-actions ${menuOpen ? "open" : ""}`}
      >
        <ul className="nav-list">
          <li>
            <NavLink to="/dashboard" end className={getClassName}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/record" className={getClassName}>
              Record
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/history" className={getClassName}>
              History
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/receivables" className={getClassName}>
              Receivables
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/profile" className={getClassName}>
              Profile
            </NavLink>
          </li>
        </ul>
        <button type="button" className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
