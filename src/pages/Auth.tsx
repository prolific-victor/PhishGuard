import { useState } from "react";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState(""); const [done, setDone] = useState(false);
  return <div className="auth-page"><div className="auth-card"><Link to="/" className="back-link"><ArrowLeft size={15} /> Back to scanner</Link><div className="auth-logo"><ShieldCheck size={26} /></div><span className="section-index">PHISHGUARD ACCOUNT</span><h1>{done ? "You're all set." : "Welcome back."}</h1><p>{done ? `Signed in locally as ${email}. Cloud accounts aren’t configured in this project.` : "Enter an email to start a local demo session."}</p>{!done && <form onSubmit={e => { e.preventDefault(); if (email.includes("@")) setDone(true); }}><label htmlFor="email">EMAIL ADDRESS</label><input id="email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /><button className="scan-button" type="submit"><LockKeyhole size={16} /> Continue</button></form>}<small>Authentication and cloud sync are not connected in this local build. Scan results remain in this browser.</small></div></div>;
}
