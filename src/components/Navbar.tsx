import { Activity, Database, LayoutDashboard, Menu, ShieldCheck, ScanLine, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

const links = [
  { to: "/", label: "Scanner", icon: ScanLine },
  { to: "/bulk-scan", label: "Bulk scan", icon: Activity },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/datasets", label: "Datasets", icon: Database },
];
export function Navbar() {
  const [open, setOpen] = useState(false);
  return <header className="topbar"><div className="nav-inner">
    <Link className="brand" to="/"><span className="brand-mark"><ShieldCheck size={21} /></span><span>phish<span>guard</span><small>THREAT INTELLIGENCE</small></span></Link>
    <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
    <nav className={open ? "nav-links open" : "nav-links"}>{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}><Icon size={16} />{label}</NavLink>)}</nav>
    <div className="nav-status"><span className="status-dot" />LOCAL ENGINE ONLINE</div>
  </div></header>;
}
