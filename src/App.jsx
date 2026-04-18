import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleDashboard from './components/layout/RoleDashboard'
import LoginPage from './pages/auth/LoginPage'
import UnauthorizedPage from './pages/auth/UnauthorizedPage'

// Admin Views
import AdminOverview from './pages/dashboards/AdminOverview'
import StaffManagement from './pages/dashboards/StaffManagement'
import AuditLogs from './pages/dashboards/AuditLogs'
import HospitalSettings from './pages/dashboards/HospitalSettings'
import AdminReports from './pages/dashboards/AdminReports'

// Doctor Views
import DoctorOverview from './pages/dashboards/DoctorOverview'
import DoctorAppointments from './pages/dashboards/DoctorAppointments'
import DoctorPatients from './pages/dashboards/DoctorPatients'
import PatientDetail from './pages/dashboards/PatientDetail'
import NewConsultation from './pages/dashboards/NewConsultation'
import DoctorLabResults from './pages/dashboards/DoctorLabResults'

// Nurse Views
import NurseOverview from './pages/dashboards/NurseOverview'
import NurseWardPatients from './pages/dashboards/NurseWardPatients'
import RecordVitals from './pages/dashboards/RecordVitals'
import VitalsHistory from './pages/dashboards/VitalsHistory'
import NurseMedicationSchedule from './pages/dashboards/NurseMedicationSchedule'
import WardManagement from './pages/dashboards/WardManagement'
import DoctorNotesView from './pages/dashboards/DoctorNotesView'

// Receptionist Views
import ReceptionOverview from './pages/dashboards/ReceptionOverview'
import PatientRegistration from './pages/dashboards/PatientRegistration'
import ReceptionAppointments from './pages/dashboards/ReceptionAppointments'
import TodaySchedule from './pages/dashboards/TodaySchedule'
import PatientProfile from './pages/dashboards/PatientProfile'

// Pharmacy Views
import PharmacyOverview from './pages/dashboards/PharmacyOverview'
import PharmacyDispense from './pages/dashboards/PharmacyDispense'
import PharmacyInventory from './pages/dashboards/PharmacyInventory'

// Laboratory Views
import LaboratoryOverview from './pages/dashboards/LaboratoryOverview'
import LaboratoryOrders from './pages/dashboards/LaboratoryOrders'
import LaboratorySamples from './pages/dashboards/LaboratorySamples'
import LaboratoryResults from './pages/dashboards/LaboratoryResults'
import LaboratoryReports from './pages/dashboards/LaboratoryReports'
import LaboratoryCatalog from './pages/dashboards/LaboratoryCatalog'
import LaboratoryRevenue from './pages/dashboards/LaboratoryRevenue'

// Accounts Views
import AccountsOverview from './pages/dashboards/AccountsOverview'
import AccountInvoices from './pages/dashboards/AccountInvoices'
import AccountReports from './pages/dashboards/AccountReports'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin Portal */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RoleDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="settings" element={<HospitalSettings />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>

          {/* Doctor Portal */}
          <Route path="/dashboard/doctor" element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
              <RoleDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<DoctorOverview />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="consultation/:appointmentId" element={<NewConsultation />} />
            <Route path="lab-results" element={<DoctorLabResults />} />
          </Route>

          {/* Nurse Portal */}
          <Route path="/dashboard/nurse" element={
            <ProtectedRoute allowedRoles={['admin', 'nurse']}>
              <RoleDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<NurseOverview />} />
            <Route path="patients" element={<NurseWardPatients />} />
            <Route path="vitals/:patientId" element={<RecordVitals />} />
            <Route path="history/:patientId" element={<VitalsHistory />} />
            <Route path="medications" element={<NurseMedicationSchedule />} />
            <Route path="ward" element={<WardManagement />} />
            <Route path="notes/:patientId" element={<DoctorNotesView />} />
          </Route>

          {/* Receptionist Portal */}
          <Route path="/dashboard/receptionist" element={
            <ProtectedRoute allowedRoles={['admin', 'receptionist', 'staff']}>
              <RoleDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<ReceptionOverview />} />
            <Route path="register" element={<PatientRegistration />} />
            <Route path="appointments" element={<ReceptionAppointments />} />
            <Route path="schedule" element={<TodaySchedule />} />
            <Route path="patients/:id" element={<PatientProfile />} />
          </Route>

          {/* Pharmacy Portal */}
          <Route path="/dashboard/pharmacy" element={
            <ProtectedRoute allowedRoles={['admin', 'pharmacy']}>
              <RoleDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<PharmacyOverview />} />
            <Route path="dispense" element={<PharmacyDispense />} />
            <Route path="inventory" element={<PharmacyInventory />} />
          </Route>

          {/* Laboratory Portal */}
          <Route path="/dashboard/laboratory" element={
            <ProtectedRoute allowedRoles={['admin', 'laboratory']}>
              <RoleDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<LaboratoryOverview />} />
            <Route path="orders" element={<LaboratoryOrders />} />
            <Route path="samples" element={<LaboratorySamples />} />
            <Route path="results" element={<LaboratoryResults />} />
            <Route path="reports" element={<LaboratoryReports />} />
            <Route path="catalog" element={<LaboratoryCatalog />} />
            <Route path="revenue" element={<LaboratoryRevenue />} />
          </Route>

          {/* Accounts Portal */}
          <Route path="/dashboard/accounts" element={
            <ProtectedRoute allowedRoles={['admin', 'accounts']}>
              <RoleDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<AccountsOverview />} />
            <Route path="invoices" element={<AccountInvoices />} />
            <Route path="reports" element={<AccountReports />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
