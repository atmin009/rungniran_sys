import { Routes, Route } from 'react-router-dom';
import CarList from './pages/CarList.jsx';
import CarDetail from './pages/CarDetail.jsx';
import SaleGate from './SaleGate.jsx';
import { AuthProvider, RequireAuth, RequireAdmin } from './admin/auth.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Login from './admin/Login.jsx';
import Dashboard from './admin/Dashboard.jsx';
import CarsAdmin from './admin/CarsAdmin.jsx';
import CarForm from './admin/CarForm.jsx';
import ImportCars from './admin/ImportCars.jsx';
import { BrandsPage, CarTypesPage, BranchesPage, DealersPage } from './admin/MasterData.jsx';
import Users from './admin/Users.jsx';
import Settings from './admin/Settings.jsx';

function PublicSite() {
  return (
    <SaleGate>
      <div className="app">
        <Routes>
          <Route path="/" element={<CarList />} />
          <Route path="/cars/:id" element={<CarDetail />} />
        </Routes>
      </div>
    </SaleGate>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={<RequireAuth><AdminLayout /></RequireAuth>}
        >
          <Route index element={<Dashboard />} />
          <Route path="cars" element={<CarsAdmin />} />
          <Route path="cars/import" element={<ImportCars />} />
          <Route path="cars/new" element={<CarForm />} />
          <Route path="cars/:id/edit" element={<CarForm />} />
          <Route path="brands" element={<RequireAdmin><BrandsPage /></RequireAdmin>} />
          <Route path="car-types" element={<RequireAdmin><CarTypesPage /></RequireAdmin>} />
          <Route path="branches" element={<RequireAdmin><BranchesPage /></RequireAdmin>} />
          <Route path="dealers" element={<RequireAdmin><DealersPage /></RequireAdmin>} />
          <Route path="users" element={<RequireAdmin><Users /></RequireAdmin>} />
          <Route path="settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
        </Route>
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </AuthProvider>
  );
}
