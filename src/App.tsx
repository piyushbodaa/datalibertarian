import { Navigate, Route, Routes } from "react-router-dom";
import { SiteFrame } from "./components/SiteFrame";
import { ComparePage } from "./pages/Compare";
import { DelhiPolicePage } from "./pages/DelhiPolice";
import { EmptyPolicePage } from "./pages/EmptyPolice";
import { GramPage } from "./pages/Gram";
import { SearchPage } from "./pages/Search";
import { TracePage } from "./pages/Trace";
import { GjPolicePage } from "./pages/GjPolice";
import { KaPolicePage } from "./pages/KaPolice";
import { KlPolicePage } from "./pages/KlPolice";
import { OdPolicePage } from "./pages/OdPolice";
import { ApPolicePage } from "./pages/ApPolice";
import { PbPolicePage } from "./pages/PbPolice";
import { HrPolicePage } from "./pages/HrPolice";
import { UkPolicePage } from "./pages/UkPolice";
import { AsPolicePage } from "./pages/AsPolice";
import { CgPolicePage } from "./pages/CgPolice";
import { GaPolicePage } from "./pages/GaPolice";
import { JhPolicePage } from "./pages/JhPolice";
import { ArPolicePage } from "./pages/ArPolice";
import { MlPolicePage } from "./pages/MlPolice";
import { MnPolicePage } from "./pages/MnPolice";
import { MzPolicePage } from "./pages/MzPolice";
import { NlPolicePage } from "./pages/NlPolice";
import { TrPolicePage } from "./pages/TrPolice";
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
        <Route path="/karnataka/police" element={<KaPolicePage />} />
        <Route path="/kerala/police" element={<KlPolicePage />} />
        <Route path="/odisha/police" element={<OdPolicePage />} />
        <Route path="/andhra-pradesh/police" element={<ApPolicePage />} />
        <Route path="/punjab/police" element={<PbPolicePage />} />
        <Route path="/haryana/police" element={<HrPolicePage />} />
        <Route path="/assam/police" element={<AsPolicePage />} />
        <Route path="/chhattisgarh/police" element={<CgPolicePage />} />
        <Route path="/jharkhand/police" element={<JhPolicePage />} />
        <Route path="/goa/police" element={<GaPolicePage />} />
        <Route path="/tripura/police" element={<TrPolicePage />} />
        <Route path="/meghalaya/police" element={<MlPolicePage />} />
        <Route path="/manipur/police" element={<MnPolicePage />} />
        <Route path="/nagaland/police" element={<NlPolicePage />} />
        <Route path="/mizoram/police" element={<MzPolicePage />} />
        <Route path="/arunachal-pradesh/police" element={<ArPolicePage />} />
        <Route path="/uttarakhand/police" element={<UkPolicePage />} />
        <Route path="/states/maharashtra/police" element={<Navigate to="/maharashtra/police" replace />} />
        <Route path="/:slug/police" element={<EmptyPolicePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteFrame>
  );
}
