import { useMemo } from "react";
import { Activity, ArrowUpRight, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { getHistory } from "../lib/phishing-analyzer";

export default function Dashboard() {
  const history = useMemo(getHistory, []);
  const dangerous = history.filter(x => x.level === "Dangerous").length;
  const suspicious = history.filter(x => x.level === "Suspicious").length;
  const safe = history.filter(x => x.level === "Safe").length;
  const avg = history.length ? Math.round(history.reduce((n, x) => n + x.score, 0) / history.length) : 0;
  const stats = [["TOTAL SCANS", history.length, Activity, "accent"], ["DANGEROUS", dangerous, ShieldAlert, "danger"], ["SUSPICIOUS", suspicious, TriangleAlert, "warning"], ["SAFE", safe, ShieldCheck, "safe"]] as const;

  return <div className="content-page">
    <div className="page-title-row"><div><span className="section-index">OVERVIEW / LOCAL ANALYTICS</span><h1>Security dashboard</h1><p>A snapshot of the URLs you’ve inspected on this device.</p></div><Link className="outline-button" to="/">New scan <ArrowUpRight size={16} /></Link></div>
    <div className="stats-grid">{stats.map(([label, value, Icon, tone]) => <article className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={19} /></div><span>{label}</span><b>{value}</b><small>ALL TIME · THIS BROWSER</small></article>)}</div>
    <div className="dashboard-grid">
      <article className="content-card chart-card">
        <div className="section-heading"><div><span className="section-index">RISK DISTRIBUTION</span><h2>Scan outcomes</h2></div><span className="local-badge">LOCAL DATA</span></div>
        {history.length ? <>
          <div className="donut-wrap"><div className="donut" style={{ background: `conic-gradient(#ff6574 0 ${dangerous / history.length * 100}%, #f2b95d ${dangerous / history.length * 100}% ${(dangerous + suspicious) / history.length * 100}%, #43d99b ${(dangerous + suspicious) / history.length * 100}% 100%)` }}><div><b>{history.length}</b><span>SCANS</span></div></div></div>
          <div className="legend"><span><i className="red" /> Dangerous <b>{dangerous}</b></span><span><i className="yellow" /> Suspicious <b>{suspicious}</b></span><span><i className="green" /> Safe <b>{safe}</b></span></div>
        </> : <div className="empty-state"><Activity size={24} /><h3>No scan data yet</h3><p>Scan a few URLs and your results will be summarized here.</p><Link to="/">Go to scanner <ArrowUpRight size={14} /></Link></div>}
      </article>
      <article className="content-card score-card">
        <div className="section-heading"><div><span className="section-index">RISK SCORE</span><h2>Average score</h2></div><Activity size={18} /></div>
        <div className="average-score"><b>{avg}</b><span>/ 100</span></div><div className="score-scale"><i /><span><b>Low</b>0</span><span><b>Moderate</b>30</span><span><b>High</b>60+</span></div><p className="muted-copy">An average across {history.length} saved {history.length === 1 ? "scan" : "scans"} in this browser.</p>
      </article>
    </div>
    <article className="content-card table-card">
      <div className="section-heading"><div><span className="section-index">MOST RECENT</span><h2>Scan activity</h2></div><Link to="/" className="text-link">Open scanner <ArrowUpRight size={14} /></Link></div>
      {history.length ? <div className="table-scroll"><table><thead><tr><th>URL</th><th>DOMAIN</th><th>RISK LEVEL</th><th>SCORE</th></tr></thead><tbody>{history.map((item, i) => <tr key={`${item.url}-${i}`}><td className="table-url">{item.url}</td><td>{item.features.domain}</td><td><span className={`table-pill ${item.level.toLowerCase()}`}>{item.level}</span></td><td className="table-score">{item.score}<span>/100</span></td></tr>)}</tbody></table></div> : <p className="table-empty">No URLs scanned yet.</p>}
    </article>
    <div className="local-warning"><ShieldCheck size={17} /><span><b>Your data stays on this device.</b> This version stores scan history locally in this browser; no account or cloud connection is required.</span></div>
  </div>;
}
