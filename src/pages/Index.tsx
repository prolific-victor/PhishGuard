import { useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowRight, Check, CircleHelp, Clock3, FileUp, Globe2, LockKeyhole, Search, Shield, ShieldAlert, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { analyzeURL, getHistory, saveAnalysis, type UrlAnalysis } from "../lib/phishing-analyzer";

const examples = ["https://github.com", "http://secure-paypaI.com/login", "http://192.168.1.1/verify"];
function levelIcon(level: UrlAnalysis["level"]) { return level === "Safe" ? <ShieldCheck /> : level === "Suspicious" ? <AlertTriangle /> : <ShieldAlert />; }
export default function Index() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<UrlAnalysis | null>(null);
  const [error, setError] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [htmlMessage, setHtmlMessage] = useState("");
  const [fetchingHtml, setFetchingHtml] = useState(false);
  const [history, setHistory] = useState(getHistory);
  const scan = (value = url) => {
    setError("");
    try { const item = analyzeURL(value, htmlContent); saveAnalysis(item); setResult(item); setUrl(value); setHistory(getHistory()); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to scan this URL"); setResult(null); }
  };
  const fetchHtml = async () => {
    setError(""); setHtmlMessage("");
    try {
      const raw = url.trim();
      const target = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
      const parsed = new URL(target);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only HTTP and HTTPS pages can be fetched.");
      setFetchingHtml(true);
      const response = await fetch(parsed.href, { mode: "cors", credentials: "omit", redirect: "follow" });
      if (!response.ok) throw new Error(`The site returned HTTP ${response.status}.`);
      const source = await response.text();
      if (source.length > 1_000_000) throw new Error("The page is larger than the 1 MB HTML limit.");
      if (!/<html|<body|<a\b|<form\b/i.test(source)) throw new Error("The response did not look like an HTML page.");
      setHtmlContent(source); setHtmlMessage("Page HTML loaded. Analyze URL to include its content.");
    } catch (err) {
      setError(err instanceof TypeError ? "The site blocked browser access (CORS). Paste or upload a saved HTML file instead." : err instanceof Error ? err.message : "Could not fetch page HTML.");
    } finally { setFetchingHtml(false); }
  };
  const loadHtmlFile = async (file?: File) => {
    if (!file) return;
    setError("");
    if (file.size > 1_000_000) { setError("HTML files must be smaller than 1 MB."); return; }
    setHtmlContent(await file.text()); setHtmlMessage(`${file.name} loaded. Analyze URL to include its content.`);
  };
  return <div className="scanner-page">
    <div className="eyebrow"><span className="eyebrow-line" /> REAL-TIME URL ANALYSIS <span className="eyebrow-live"><i /> LIVE ENGINE</span></div>
    <section className="hero"><div className="hero-copy"><h1>See the threat<br />before <span>it sees you.</span></h1><p>Inspect suspicious links with URL and page-content checks. Get a clear risk score and understand what made a URL dangerous.</p><div className="hero-points"><span><Check size={15} /> Instant analysis</span><span><Check size={15} /> URL and HTML signals</span><span><Check size={15} /> Parsed locally</span></div></div><div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="shield-core"><Shield size={76} strokeWidth={1.25} /><span><i /></span></div><div className="orbit-label label-top"><span>THREAT SCAN</span><b>ACTIVE</b></div><div className="orbit-label label-bottom"><span>HEURISTIC ENGINE</span><b>HTML CHECKS</b></div><div className="float-chip"><Sparkles size={14} /> LOCAL ANALYSIS</div></div></section>
    <section className="scan-panel"><div className="panel-top"><div><span className="section-index">01 / SCAN TARGET</span><h2>Paste a URL to inspect</h2><p>URL signals run locally. Add page HTML below to inspect its links, wording, and forms.</p></div><div className="scan-panel-icon"><Search size={20} /></div></div>
      <form className="url-form" onSubmit={e => { e.preventDefault(); scan(); }}><div className="url-input-wrap"><Globe2 size={18} /><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/login" aria-label="URL to scan"/><button type="button" className="clear-url" onClick={() => { setUrl(""); setResult(null); setError(""); }}>CLEAR</button></div><button className="scan-button" type="submit"><Search size={17} /> Analyze URL <ArrowRight size={16} /></button></form>
      <div className="html-source"><div className="html-source-heading"><b>OPTIONAL · PAGE HTML</b><span>{htmlContent ? `${htmlContent.length.toLocaleString()} characters loaded` : "Add markup to inspect links, text, and forms"}</span></div><textarea aria-label="Page HTML source" value={htmlContent} onChange={e => { setHtmlContent(e.target.value.slice(0, 1_000_000)); setHtmlMessage(""); }} placeholder="Paste page source here, or load it from the URL / an HTML file…"/><div className="html-source-actions"><button type="button" className="outline-button" onClick={fetchHtml} disabled={fetchingHtml || !url.trim()}>{fetchingHtml ? "Loading…" : "Fetch page HTML"}</button><label className="outline-button html-file-button"><FileUp size={14} /> Load HTML file<input type="file" accept=".html,.htm,text/html" onChange={e => { void loadHtmlFile(e.target.files?.[0]); e.target.value = ""; }} /></label>{htmlContent && <button type="button" className="clear-url" onClick={() => { setHtmlContent(""); setHtmlMessage(""); }}>Clear HTML</button>}</div><small>A direct fetch sends a request to the target site and may be blocked by its browser policy. HTML is parsed locally; scripts are not run. Maximum size: 1 MB.</small>{htmlMessage && <div className="html-message">{htmlMessage}</div>}</div>
      {error && <div className="form-error"><AlertTriangle size={16} />{error}</div>}
      <div className="examples"><span>TRY AN EXAMPLE</span>{examples.map(example => <button key={example} onClick={() => scan(example)}>{example.replace(/^https?:\/\//, "")}</button>)}</div>
    </section>
    {result && <section className={`result-card result-${result.level.toLowerCase()}`}><div className="result-heading"><div className="result-icon">{levelIcon(result.level)}</div><div><span className="section-index">ANALYSIS COMPLETE · {result.features.protocol}</span><h2>{result.level} <span>destination</span></h2><p className="result-url">{result.url}</p></div><div className="score"><strong>{result.score}</strong><small>/100 RISK SCORE</small></div></div><div className="score-track"><span style={{ width: `${result.score}%` }} /></div><div className="result-layout"><div className="indicator-column"><div className="result-subhead"><h3>Threat indicators</h3><span>{result.indicators.filter(i => i.detected).length} / {result.indicators.length} triggered</span></div><div className="indicator-list">{result.indicators.map(ind => <div className={`indicator-row${ind.detected ? " triggered" : ""}`} key={ind.name}><span className="indicator-check">{ind.detected ? <AlertTriangle size={14} /> : <Check size={14} />}</span><span className="indicator-title">{ind.name}<small>{ind.description}</small></span><span className={`severity severity-${ind.severity}`}>{ind.severity}</span></div>)}</div></div><aside className="feature-column"><div className="result-subhead"><h3>URL profile</h3><CircleHelp size={15} /></div><div className="feature-grid">{[["DOMAIN", result.features.domain], ["PROTOCOL", result.features.protocol], ["TLD", `.${result.features.tld}`], ["URL LENGTH", `${result.features.length} chars`], ["SUBDOMAINS", result.features.subdomains], ["DOMAIN ENTROPY", result.features.entropy]].map(([label, value]) => <div className="feature-cell" key={label}><span>{label}</span><b>{value}</b></div>)}</div><div className="privacy-note"><LockKeyhole size={15} /><span>{htmlContent ? "Markup is analyzed locally; fetching it contacts the target site directly." : "URL analysis runs in your browser; no app server is contacted."}</span></div></aside></div></section>}
    <section className="below-grid"><div className="history-panel"><div className="section-heading"><div><span className="section-index">YOUR RECENT ACTIVITY</span><h2>Scan history</h2></div><Clock3 size={18} /></div>{history.length ? <div className="history-list">{history.slice(0, 4).map((item, i) => <button className="history-row" key={`${item.url}-${i}`} onClick={() => { setUrl(item.url); setResult(item); }}><span className={`history-dot ${item.level.toLowerCase()}`} /><span className="history-url">{item.url}<small>{item.features.domain}</small></span><span className={`history-level ${item.level.toLowerCase()}`}>{item.level}</span><b className="history-score">{item.score}</b><ArrowDownRight size={15} /></button>)}</div> : <div className="empty-history"><Clock3 size={20} /><p>Your scans will appear here.</p><small>Start with any URL above.</small></div>}</div><div className="method-card"><div className="method-icon"><Zap size={20} /></div><span className="section-index">HOW IT WORKS</span><h3>Signals over guesswork.</h3><p>Each URL is checked against 12 URL indicators plus three page-content checks when HTML is supplied.</p><div className="method-stat"><b>12 + 3</b><span>URL / HTML SIGNALS</span><ArrowRight size={16} /></div></div></section>
    <footer className="footer"><span>PHISHGUARD <i>•</i> PERSONAL THREAT INTELLIGENCE</span><span>HEURISTIC ANALYSIS · NOT A REPLACEMENT FOR SECURITY SOFTWARE</span></footer>
  </div>;
}
