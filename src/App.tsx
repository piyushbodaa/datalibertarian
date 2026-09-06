import { Navigate, Route, Routes } from "react-router-dom";
import { SiteFrame } from "./components/SiteFrame";
import { HomePage } from "./pages/Home";
import { PolicePage } from "./pages/Police";
import { SourcesPage } from "./pages/Sources";

export default function App() {
  return (
    <SiteFrame>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/maharashtra/police" element={<PolicePage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteFrame>
  );
}
