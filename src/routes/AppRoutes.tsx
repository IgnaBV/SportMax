import { HR_ROLES } from "@/modules/hr/permissions";
import { lazy } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  Link,
} from "react-router-dom";
import { useAuth, homeForRole, type Role } from "@/context/auth";
import AppLayout from "@/components/layout/AppLayout";
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const InventoryDashboard = lazy(
  () => import("@/modules/inventory/pages/InventoryDashboard"),
);
const ProductsPage = lazy(
  () => import("@/modules/inventory/pages/ProductsPage"),
);
const StockPage = lazy(() => import("@/modules/inventory/pages/StockPage"));
const EntryPage = lazy(() => import("@/modules/inventory/pages/EntryPage"));
const ExitPage = lazy(() => import("@/modules/inventory/pages/ExitPage"));
const AdjustmentPage = lazy(
  () => import("@/modules/inventory/pages/AdjustmentPage"),
);
const MovementsPage = lazy(
  () => import("@/modules/inventory/pages/MovementsPage"),
);
const HRDashboard = lazy(() => import("@/modules/hr/pages/HRDashboard"));
const EmployeesPage = lazy(() => import("@/modules/hr/pages/EmployeesPage"));
const AttendancePage = lazy(() => import("@/modules/hr/pages/AttendancePage"));
const PermissionsPage = lazy(
  () => import("@/modules/hr/pages/PermissionsPage"),
);
const VacationsPage = lazy(() => import("@/modules/hr/pages/VacationsPage"));
const DocumentsPage = lazy(() => import("@/modules/hr/pages/DocumentsPage"));
const EmployeeDetail = lazy(
  () => import("@/modules/hr/components/EmployeeDetail"),
);
function Protected() {
  const { session, role, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="loading">Recuperando sesión…</div>;
  if (!session) return <Navigate to="/login" state={null} replace />;
  if (!role) return <Navigate to="/login" state={null} replace />;
  const home = homeForRole(role);
  if (
    role !== "ADMINISTRADOR" &&
    pathname !== home &&
    !pathname.startsWith(`${home}/`)
  )
    return <Navigate to={home} state={null} replace />;
  return <Outlet />;
}
function Allowed({ roles }: { roles: Role[] }) {
  const { role } = useAuth();
  if (!role || !roles.includes(role))
    return <Navigate to={homeForRole(role)} state={null} replace />;
  return <Outlet />;
}
export default function AppRoutes() {
  const { role } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route element={<AppLayout />}>
          <Route
            index
            element={<Navigate to={homeForRole(role)} state={null} replace />}
          />
          <Route element={<Allowed roles={["ADMINISTRADOR"]} />}>
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
          <Route element={<Allowed roles={["ADMINISTRADOR", "INVENTARIO"]} />}>
            <Route path="inventory" element={<InventoryDashboard />} />
            <Route path="inventory/products" element={<ProductsPage />} />
            <Route path="inventory/stock" element={<StockPage />} />
            <Route path="inventory/entries" element={<EntryPage />} />
            <Route path="inventory/exits" element={<ExitPage />} />
            <Route path="inventory/adjustments" element={<AdjustmentPage />} />
            <Route path="inventory/movements" element={<MovementsPage />} />
          </Route>
          <Route element={<Allowed roles={HR_ROLES} />}>
            <Route path="hr" element={<HRDashboard />} />
            <Route path="hr/employees" element={<EmployeesPage />} />
            <Route
              path="hr/employees/:employeeId"
              element={<EmployeeDetail />}
            />
            <Route path="hr/attendance" element={<AttendancePage />} />
            <Route path="hr/permissions" element={<PermissionsPage />} />
            <Route path="hr/vacations" element={<VacationsPage />} />
            <Route path="hr/documents" element={<DocumentsPage />} />
          </Route>
          <Route
            path="*"
            element={
              <div className="empty">
                <h1>404</h1>
                <h2>No encontramos esta página</h2>
                <p>Utiliza el menú para continuar.</p>
                <Link className="text-link" to={homeForRole(role)} replace>
                  Volver al inicio
                </Link>
              </div>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
