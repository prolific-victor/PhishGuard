import { ChangeEvent, useState } from "react";
import { Database, FileUp, Trash2, Upload } from "lucide-react";
type Dataset = { name: string; rows: number; malicious: number; benign: number; imported: string };
const KEY = "phishguard.datasets";
function load(): Dataset[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
export default function Datasets() {
  const [items, setItems] = useState<Dataset[]>(load);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setError(""); setMessage("");
    try {
      const text = await file.text(); const lines = text.split(/\r?\n/).filter(Boolean); if (lines.length < 2) throw new Error("CSV needs a header and at least one data row.");
      const headers = lines[0].split(",").map(x => x.trim().replace(/^"|"$/g, "").toLowerCase()); const urlCol = headers.indexOf("url"); const labelCol = headers.indexOf("label");
      if (urlCol < 0 || labelCol < 0) throw new Error("CSV must include columns named url and label.");
      let malicious = 0; let benign = 0;
      for (const line of lines.slice(1)) { const cells = line.split(",").map(x => x.trim().replace(/^"|"$/g, "").toLowerCase()); if (!cells[urlCol]) continue; if (["malicious", "phishing", "1", "bad"].includes(cells[labelCol])) malicious++; else benign++; }
      const next = [{ name: file.name, rows: malicious + benign, malicious, benign, imported: new Date().toLocaleDateString() }, ...items]; setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); setMessage(`${file.name} imported: ${malicious + benign} labeled URLs.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not read this CSV file."); }
    event.target.value = "";
  };
  const remove = (index: number) => { const next = items.filter((_, i) => i !== index); setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  return <div className="content-page"><div className="page-title-row"><div><span className="section-index">RESEARCH / REFERENCE FILES</span><h1>Datasets</h1><p>Import labeled URL data to organize your local research.</p></div><div className="bulk-head-icon"><Database size={24} /></div></div><div className="content-card upload-card"><div className="upload-icon"><FileUp size={22} /></div><h2>Upload a labeled CSV</h2><p>Choose a CSV with <code>url</code> and <code>label</code> columns. Labels such as malicious/phishing or benign are counted.</p><label className="upload-button"><Upload size={16} /> Choose CSV file<input type="file" accept=".csv,text/csv" onChange={upload} /></label>{message && <div className="success-message">{message}</div>}{error && <div className="form-error centered-error">{error}</div>}<small>CSV file stays in your browser; only the dataset summary is saved locally.</small></div><div className="section-heading dataset-heading"><div><span className="section-index">LOCAL LIBRARY</span><h2>Your datasets <span className="count-chip">{items.length}</span></h2></div></div>{items.length ? <div className="dataset-list">{items.map((item, i) => <article className="content-card dataset-row" key={`${item.name}-${i}`}><div className="dataset-icon"><Database size={18} /></div><div className="dataset-info"><b>{item.name}</b><span>Imported {item.imported}</span></div><div className="dataset-count"><b>{item.rows.toLocaleString()}</b><span>URLS</span></div><div className="dataset-count bad"><b>{item.malicious.toLocaleString()}</b><span>MALICIOUS</span></div><div className="dataset-count good"><b>{item.benign.toLocaleString()}</b><span>BENIGN</span></div><button className="icon-button danger-button" title="Delete dataset" onClick={() => remove(i)}><Trash2 size={16} /></button></article>)}</div> : <div className="empty-datasets"><Database size={23} /><b>No datasets added yet</b><span>Upload a CSV to start building your research library.</span></div>}</div>;
}
