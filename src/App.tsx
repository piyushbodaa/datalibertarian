import { Navigate, Route, Routes } from "react-router-dom";
import { SiteFrame } from "./components/SiteFrame";
import { EmptyPolicePage } from "./pages/EmptyPolice";
import { HomePage } from "./pages/Home";
import { MunicipalPage } from "./pages/Municipal";
import { PolicePage } from "./pages/Police";
import { SourcesPage } from "./pages/Sources";
import { StatesPage } from "./pages/States";
import { UnionPage } from "./pages/Union";
import { UnionPolicePage } from "./pages/UnionPolice";

export default function App() {
  return (
    <SiteFrame>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/union" element={<UnionPage />} />
        <Route path="/union/police" element={<UnionPolicePage />} />
        <Route path="/states" element={<StatesPage />} />
        <Route path="/municipal" element={<MunicipalPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/maharashtra/police" element={<PolicePage />} />
        <Route path="/states/maharashtra/police" element={<Navigate to="/maharashtra/police" replace />} />
        <Route path="/:slug/police" element={<EmptyPolicePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteFrame>
  );
}
