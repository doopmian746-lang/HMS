import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'

const departmentMeta = {
  admin: {
    title: "Administration Control",
    subtitle: "Manage hospital staff, system settings, and institutional reporting."
  },
  doctor: {
    title: "Clinical Terminal",
    subtitle: "Deliver patient care, manage appointments, and track medical histories."
  },
  nurse: {
    title: "Nurse Operations",
    subtitle: "Coordinate ward care, update vitals, and manage patient schedules."
  },
  receptionist: {
    title: "Front Desk Registry",
    subtitle: "Patient intake, appointment booking, and daily flow management."
  },
  pharmacy: {
    title: "Pharmacy Portal",
    subtitle: "Inventory intelligence, prescription dispensing, and drug registry."
  },
  laboratory: {
    title: "Diagnostic Lab",
    subtitle: "Test fulfillment, technical results, and diagnostic history."
  },
  accounts: {
    title: "Financial Portal",
    subtitle: "Hospital billing, insurance claims, and revenue analytics."
  }
}

export default function RoleDashboard() {
  const { role } = useAuth()
  const location = useLocation()
  
  // Determine meta based on path for Super Admin, otherwise use role
  let activeRole = role
  if (role === 'admin') {
    if (location.pathname.includes('/pharmacy')) activeRole = 'pharmacy'
    else if (location.pathname.includes('/laboratory')) activeRole = 'laboratory'
    else if (location.pathname.includes('/accounts')) activeRole = 'accounts'
    else if (location.pathname.includes('/doctor')) activeRole = 'doctor'
    else if (location.pathname.includes('/nurse')) activeRole = 'nurse'
    else if (location.pathname.includes('/receptionist')) activeRole = 'receptionist'
  }

  const meta = departmentMeta[activeRole] || departmentMeta.admin

  return (
    <DashboardLayout pageTitle={meta.title} pageSubtitle={meta.subtitle}>
      <Outlet />
    </DashboardLayout>
  )
}
