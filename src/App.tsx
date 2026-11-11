import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import BulkScan from "./pages/BulkScan";

export default function App() {
  return <BrowserRouter><div className="app-shell"><Navbar /><main className="page-wrap"><Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/datasets" element={<Datasets />} />
    <Route path="/bulk-scan" element={<BulkScan />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></main></div></BrowserRouter>;
}
