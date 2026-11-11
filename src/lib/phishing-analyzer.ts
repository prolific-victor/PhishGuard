export type Severity = "low" | "medium" | "high" | "critical";
export type Indicator = { name: string; severity: Severity; weight: number; description: string; detected: boolean };
export type UrlAnalysis = { url: string; score: number; level: "Safe" | "Suspicious" | "Dangerous"; indicators: Indicator[]; features: { domain: string; protocol: string; tld: string; length: number; subdomains: number; entropy: number; parameters: number } };

const brands = ["paypal", "google", "microsoft", "apple", "amazon", "facebook", "instagram", "netflix", "bankofamerica", "chase"];
const phishingWords = ["login", "verify", "secure", "account", "update", "password", "signin", "wallet", "billing", "confirm"];
const suspiciousTlds = new Set(["tk", "xyz", "buzz", "top", "click", "work", "support", "zip", "mov"]);
function entropy(value: string) {
  if (!value) return 0;
  const counts = new Map<string, number>();
  for (const char of value) counts.set(char, (counts.get(char) || 0) + 1);
  return [...counts.values()].reduce((sum, count) => { const p = count / value.length; return sum - p * Math.log2(p); }, 0);
}

export function analyzeURL(input: string, htmlContent = ""): UrlAnalysis {
  const raw = input.trim();
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`;
  let parsed: URL;
  try { parsed = new URL(candidate); } catch { throw new Error("Enter a valid URL or domain, such as example.com"); }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only HTTP and HTTPS URLs can be scanned");
  const hostname = parsed.hostname.toLowerCase();
  const labels = hostname.split(".");
  const domain = labels.slice(-2).join(".");
  const tld = labels.at(-1) || "";
  const domainName = labels.length > 1 ? labels.at(-2)! : hostname;
  const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
  const brandMatch = brands.some(brand => hostname.includes(brand) && domainName !== brand);
  const encodedCount = (raw.match(/%[\da-f]{2}/gi) || []).length;
  const params = [...parsed.searchParams].length;
  const specialCount = (raw.match(/[!@#$%^&*()_+=[\]{};':"\\|,<>/?]/g) || []).length;
  const signals = [
    { name: "IP address in hostname", severity: "critical" as const, weight: 25, description: "Uses a raw IP address instead of a recognizable domain", detected: looksLikeIp },
    { name: "Missing HTTPS", severity: "high" as const, weight: 15, description: "Connection is not protected by HTTPS", detected: parsed.protocol !== "https:" },
    { name: "Suspicious top-level domain", severity: "high" as const, weight: 20, description: "Domain extension is frequently abused in phishing", detected: suspiciousTlds.has(tld) },
    { name: "Excessive subdomains", severity: "medium" as const, weight: 15, description: "Three or more subdomains can disguise the real destination", detected: labels.length > 3 },
    { name: "Unusually long URL", severity: "medium" as const, weight: 10, description: "URL exceeds 75 characters", detected: raw.length > 75 },
    { name: "Phishing related words", severity: "medium" as const, weight: 15, description: "URL contains words commonly used to solicit credentials", detected: phishingWords.some(word => raw.toLowerCase().includes(word)) },
    { name: "High domain entropy", severity: "medium" as const, weight: 12, description: "Domain name looks unusually random or machine generated", detected: entropy(domainName) > 3.5 },
    { name: "Excessive special characters", severity: "medium" as const, weight: 10, description: "URL contains more than five special characters", detected: specialCount > 5 },
    { name: "@ symbol in URL", severity: "critical" as const, weight: 25, description: "An @ symbol can obscure the actual destination", detected: raw.includes("@") },
    { name: "Possible brand impersonation", severity: "critical" as const, weight: 30, description: "A known brand name appears in a non-matching domain", detected: brandMatch },
    { name: "Heavy URL encoding", severity: "high" as const, weight: 15, description: "Encoded characters may conceal the destination", detected: encodedCount > 3 },
    { name: "Excessive query parameters", severity: "low" as const, weight: 5, description: "URL contains more than four query parameters", detected: params > 4 },
  ];
  if (htmlContent.trim()) {
    // DOMParser reads the markup without executing scripts or loading page resources.
    const html = new DOMParser().parseFromString(htmlContent, "text/html");
    html.querySelectorAll("script, style, noscript, template").forEach(node => node.remove());
    const pageText = (html.body.textContent || "").toLowerCase();
    const anchors = [...html.querySelectorAll("a[href]")];
    const suspiciousLinks = anchors.filter(anchor => {
      const href = anchor.getAttribute("href")?.trim() || "";
      if (/^(javascript|data|vbscript):/i.test(href)) return true;
      try {
        const target = new URL(href, candidate);
        const targetLabels = target.hostname.toLowerCase().split(".");
        const targetDomainName = targetLabels.length > 1 ? targetLabels.at(-2)! : target.hostname;
        const impersonatesBrand = brands.some(brand => target.hostname.toLowerCase().includes(brand) && targetDomainName !== brand);
        return !["http:", "https:"].includes(target.protocol)
          || /^\d{1,3}(\.\d{1,3}){3}$/.test(target.hostname)
          || phishingWords.some(word => target.href.toLowerCase().includes(word))
          || impersonatesBrand;
      } catch { return true; }
    });
    const forms = [...html.querySelectorAll("form")];
    const riskyCredentialForm = forms.some(form => {
      if (!form.querySelector('input[type="password"]')) return false;
      const action = form.getAttribute("action")?.trim() || candidate;
      try {
        const target = new URL(action, candidate);
        return !["http:", "https:"].includes(target.protocol)
          || target.protocol !== parsed.protocol
          || target.hostname !== hostname;
      } catch { return true; }
    });
    signals.push(
      { name: "Suspicious links in page", severity: "high" as const, weight: 20, description: `${suspiciousLinks.length} of ${anchors.length} page links use risky destinations or phishing patterns`, detected: suspiciousLinks.length > 0 },
      { name: "Phishing language in page", severity: "medium" as const, weight: 12, description: "Visible page text contains credential or account pressure terms", detected: phishingWords.some(word => new RegExp(`\\b${word}\\b`, "i").test(pageText)) },
      { name: "Risky credential form", severity: "critical" as const, weight: 30, description: "A password form submits to a different host or insecure protocol", detected: riskyCredentialForm },
    );
  }
  const score = Math.min(100, signals.reduce((sum, signal) => sum + (signal.detected ? signal.weight : 0), 0));
  return { url: raw, score, level: score >= 60 ? "Dangerous" : score >= 30 ? "Suspicious" : "Safe", indicators: signals, features: { domain, protocol: parsed.protocol.replace(":", "").toUpperCase(), tld, length: raw.length, subdomains: Math.max(0, labels.length - 2), entropy: Number(entropy(domainName).toFixed(2)), parameters: params } };
}

const HISTORY_KEY = "phishguard.scan-history";
export function getHistory(): UrlAnalysis[] { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
export function saveAnalysis(item: UrlAnalysis) { const all = [item, ...getHistory()].slice(0, 100); localStorage.setItem(HISTORY_KEY, JSON.stringify(all)); }
