import { Navigate, Route, Routes } from "react-router-dom";
import { SiteFrame } from "./components/SiteFrame";
import { DelhiPolicePage } from "./pages/DelhiPolice";
import { EmptyPolicePage } from "./pages/EmptyPolice";
import { HomePage } from "./pages/Home";
import { MunicipalPage } from "./pages/Municipal";
import { PolicePage } from "./pages/Police";
import { SourcesPage } from "./pages/Sources";
import { StatesPage } from "./pages/States";
import { TgCommissioneratePage } from "./pages/TgCommissionerate";
import { TgCommissioneratesPage } from "./pages/TgCommissionerates";
import { TgPolicePage } from "./pages/TgPolice";
import { TgStationEmptyPage } from "./pages/TgStationEmpty";
import { TgStationIndexPage } from "./pages/TgStationIndex";
import { UnionPage } from "./pages/Union";
import { UnionPolicePage } from "./pages/UnionPolice";
import { UpPolicePage } from "./pages/UpPolice";
import { WbPolicePage } from "./pages/WbPolice";

export default function App() {
  return (
    <SiteFrame>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/union" element={<UnionPage />} />
        <Route path="/union/police" element={<UnionPolicePage />} />
        <Route path="/union/delhi-police" element={<DelhiPolicePage />} />
        <Route path="/states" element={<StatesPage />} />
        <Route path="/municipal" element={<MunicipalPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/maharashtra/police" element={<PolicePage />} />
        <Route path="/uttar-pradesh/police" element={<UpPolicePage />} />
        <Route path="/telangana/police" element={<TgPolicePage />} />
        <Route path="/telangana/commissionerates" element={<TgCommissioneratesPage />} />
        <Route path="/telangana/:cp/stations/:station" element={<TgStationEmptyPage />} />
        <Route path="/telangana/:cp/stations" element={<TgStationIndexPage />} />
        <Route path="/telangana/:cp" element={<TgCommissioneratePage />} />
        <Route path="/west-bengal/police" element={<WbPolicePage />} />
        <Route path="/states/maharashtra/police" element={<Navigate to="/maharashtra/police" replace />} />
        <Route path="/:slug/police" element={<EmptyPolicePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteFrame>
  );
}
