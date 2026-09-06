import { Navigate, Route, Routes } from "react-router-dom";
import { SiteFrame } from "./components/SiteFrame";
import { ComparePage } from "./pages/Compare";
import { DelhiPolicePage } from "./pages/DelhiPolice";
import { EmptyPolicePage } from "./pages/EmptyPolice";
import { GramPage } from "./pages/Gram";
import { SearchPage } from "./pages/Search";
import { TracePage } from "./pages/Trace";
import { GjPolicePage } from "./pages/GjPolice";
import { HomePage } from "./pages/Home";
import { MunicipalPage } from "./pages/Municipal";
import { PolicePage } from "./pages/Police";
import { TnPolicePage } from "./pages/TnPolice";
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
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/trace/:layer/:slug" element={<TracePage />} />
        <Route path="/trace/:slug" element={<TracePage />} />
        <Route path="/union" element={<UnionPage />} />
        <Route path="/union/police" element={<UnionPolicePage />} />
        <Route path="/union/delhi-police" element={<DelhiPolicePage />} />
        <Route path="/states" element={<StatesPage />} />
        <Route path="/municipal" element={<MunicipalPage />} />
        <Route path="/gram" element={<GramPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/maharashtra/police" element={<PolicePage />} />
        <Route path="/uttar-pradesh/police" element={<UpPolicePage />} />
        <Route path="/telangana/police" element={<TgPolicePage />} />
        <Route path="/telangana/commissionerates" element={<TgCommissioneratesPage />} />
        <Route path="/telangana/:cp/stations/:station" element={<TgStationEmptyPage />} />
        <Route path="/telangana/:cp/stations" element={<TgStationIndexPage />} />
        <Route path="/telangana/:cp" element={<TgCommissioneratePage />} />
        <Route path="/west-bengal/police" element={<WbPolicePage />} />
        <Route path="/gujarat/police" element={<GjPolicePage />} />
        <Route path="/tamil-nadu/police" element={<TnPolicePage />} />
        <Route path="/states/maharashtra/police" element={<Navigate to="/maharashtra/police" replace />} />
        <Route path="/:slug/police" element={<EmptyPolicePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteFrame>
  );
}
