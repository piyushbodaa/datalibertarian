import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { PageFallback } from "./components/PageFallback";
import { SiteFrame } from "./components/SiteFrame";
import { HomePage } from "./pages/Home";

const ComparePage = lazy(() => import("./pages/Compare").then((m) => ({ default: m.ComparePage })));
const DelhiPolicePage = lazy(() =>
  import("./pages/DelhiPolice").then((m) => ({ default: m.DelhiPolicePage })),
);
const EmptyPolicePage = lazy(() =>
  import("./pages/EmptyPolice").then((m) => ({ default: m.EmptyPolicePage })),
);
const GramPage = lazy(() => import("./pages/Gram").then((m) => ({ default: m.GramPage })));
const SearchPage = lazy(() => import("./pages/Search").then((m) => ({ default: m.SearchPage })));
const TracePage = lazy(() => import("./pages/Trace").then((m) => ({ default: m.TracePage })));
const GjPolicePage = lazy(() => import("./pages/GjPolice").then((m) => ({ default: m.GjPolicePage })));
const KaPolicePage = lazy(() => import("./pages/KaPolice").then((m) => ({ default: m.KaPolicePage })));
const KlPolicePage = lazy(() => import("./pages/KlPolice").then((m) => ({ default: m.KlPolicePage })));
const OdPolicePage = lazy(() => import("./pages/OdPolice").then((m) => ({ default: m.OdPolicePage })));
const ApPolicePage = lazy(() => import("./pages/ApPolice").then((m) => ({ default: m.ApPolicePage })));
const PbPolicePage = lazy(() => import("./pages/PbPolice").then((m) => ({ default: m.PbPolicePage })));
const HrPolicePage = lazy(() => import("./pages/HrPolice").then((m) => ({ default: m.HrPolicePage })));
const UkPolicePage = lazy(() => import("./pages/UkPolice").then((m) => ({ default: m.UkPolicePage })));
const SkPolicePage = lazy(() => import("./pages/SkPolice").then((m) => ({ default: m.SkPolicePage })));
const RjPolicePage = lazy(() => import("./pages/RjPolice").then((m) => ({ default: m.RjPolicePage })));
const HpPolicePage = lazy(() => import("./pages/HpPolice").then((m) => ({ default: m.HpPolicePage })));
const BrPolicePage = lazy(() => import("./pages/BrPolice").then((m) => ({ default: m.BrPolicePage })));
const AsPolicePage = lazy(() => import("./pages/AsPolice").then((m) => ({ default: m.AsPolicePage })));
const CgPolicePage = lazy(() => import("./pages/CgPolice").then((m) => ({ default: m.CgPolicePage })));
const GaPolicePage = lazy(() => import("./pages/GaPolice").then((m) => ({ default: m.GaPolicePage })));
const JhPolicePage = lazy(() => import("./pages/JhPolice").then((m) => ({ default: m.JhPolicePage })));
const ArPolicePage = lazy(() => import("./pages/ArPolice").then((m) => ({ default: m.ArPolicePage })));
const MlPolicePage = lazy(() => import("./pages/MlPolice").then((m) => ({ default: m.MlPolicePage })));
const MnPolicePage = lazy(() => import("./pages/MnPolice").then((m) => ({ default: m.MnPolicePage })));
const MzPolicePage = lazy(() => import("./pages/MzPolice").then((m) => ({ default: m.MzPolicePage })));
const NlPolicePage = lazy(() => import("./pages/NlPolice").then((m) => ({ default: m.NlPolicePage })));
const TrPolicePage = lazy(() => import("./pages/TrPolice").then((m) => ({ default: m.TrPolicePage })));
const MunicipalPage = lazy(() =>
  import("./pages/Municipal").then((m) => ({ default: m.MunicipalPage })),
);
const PolicePage = lazy(() => import("./pages/Police").then((m) => ({ default: m.PolicePage })));
const TnPolicePage = lazy(() => import("./pages/TnPolice").then((m) => ({ default: m.TnPolicePage })));
const SourcesPage = lazy(() => import("./pages/Sources").then((m) => ({ default: m.SourcesPage })));
const StatesPage = lazy(() => import("./pages/States").then((m) => ({ default: m.StatesPage })));
const TgCommissioneratePage = lazy(() =>
  import("./pages/TgCommissionerate").then((m) => ({ default: m.TgCommissioneratePage })),
);
const TgCommissioneratesPage = lazy(() =>
  import("./pages/TgCommissionerates").then((m) => ({ default: m.TgCommissioneratesPage })),
);
const TgPolicePage = lazy(() => import("./pages/TgPolice").then((m) => ({ default: m.TgPolicePage })));
const TgStationEmptyPage = lazy(() =>
  import("./pages/TgStationEmpty").then((m) => ({ default: m.TgStationEmptyPage })),
);
const TgStationIndexPage = lazy(() =>
  import("./pages/TgStationIndex").then((m) => ({ default: m.TgStationIndexPage })),
);
const UnionPage = lazy(() => import("./pages/Union").then((m) => ({ default: m.UnionPage })));
const UnionPolicePage = lazy(() =>
  import("./pages/UnionPolice").then((m) => ({ default: m.UnionPolicePage })),
);
const UpPolicePage = lazy(() => import("./pages/UpPolice").then((m) => ({ default: m.UpPolicePage })));
const WbPolicePage = lazy(() => import("./pages/WbPolice").then((m) => ({ default: m.WbPolicePage })));
const InflationPage = lazy(() => import("./pages/Inflation").then((m) => ({ default: m.InflationPage })));
const InflationMethodPage = lazy(() =>
  import("./pages/InflationMethod").then((m) => ({ default: m.InflationMethodPage })),
);
const InflationItemPage = lazy(() =>
  import("./pages/InflationItem").then((m) => ({ default: m.InflationItemPage })),
);
const InflationCategoryPage = lazy(() =>
  import("./pages/InflationCategory").then((m) => ({ default: m.InflationCategoryPage })),
);

function InflationHostGate() {
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hostname.startsWith("inflation.") && loc.pathname === "/") {
      nav("/inflation", { replace: true });
    }
  }, [loc.pathname, nav]);
  return null;
}

export default function App() {
  return (
    <SiteFrame>
      <InflationHostGate />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/inflation" element={<InflationPage />} />
          <Route path="/inflation/method" element={<InflationMethodPage />} />
          <Route path="/inflation/item/:id" element={<InflationItemPage />} />
          <Route path="/inflation/:category" element={<InflationCategoryPage />} />
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
          <Route path="/sikkim/police" element={<SkPolicePage />} />
          <Route path="/rajasthan/police" element={<RjPolicePage />} />
          <Route path="/himachal-pradesh/police" element={<HpPolicePage />} />
          <Route path="/bihar/police" element={<BrPolicePage />} />
          <Route path="/states/maharashtra/police" element={<Navigate to="/maharashtra/police" replace />} />
          <Route path="/:slug/police" element={<EmptyPolicePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </SiteFrame>
  );
}
