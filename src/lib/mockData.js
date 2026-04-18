// High-fidelity Mock Data for HMS Frontend-Only Mode
export const MOCK_DATA = {
  profiles: [
    { id: '1', user_id: 'u1', full_name: 'Admin User', role: 'admin', department: 'Management' },
    { id: '2', user_id: 'u2', full_name: 'Dr. Sarah Smith', role: 'doctor', department: 'Cardiology' },
    { id: '3', user_id: 'u3', full_name: 'Dr. James Wilson', role: 'doctor', department: 'General Medicine' },
    { id: '4', user_id: 'u4', full_name: 'Nurse Emily Brown', role: 'nurse', department: 'Ward A' },
    { id: '5', user_id: 'u5', full_name: 'John Receptionist', role: 'receptionist', department: 'Front Desk' },
    { id: '6', user_id: 'u6', full_name: 'Mary Pharmacist', role: 'pharmacy', department: 'Pharmacy' },
    { id: '7', user_id: 'u7', full_name: 'Ted Lab Tech', role: 'laboratory', department: 'Laboratory' },
    { id: '8', user_id: 'u8', full_name: 'Alice Accountant', role: 'accounts', department: 'Finance' },
  ],
  
  patients: [
    { id: 'p1', registration_no: 'PAT-001', full_name: 'John Doe', date_of_birth: '1985-05-12', gender: 'male', blood_group: 'A+', phone: '555-0101', address: '123 Main St', emergency_contact: 'Jane Doe (555-0102)' },
    { id: 'p2', registration_no: 'PAT-002', full_name: 'Alice Johnson', date_of_birth: '1992-09-20', gender: 'female', blood_group: 'O-', phone: '555-0201', address: '456 Oak Ave', emergency_contact: 'Robert Johnson (555-0202)' },
    { id: 'p3', registration_no: 'PAT-003', full_name: 'Michael Chen', date_of_birth: '1978-03-15', gender: 'male', blood_group: 'B+', phone: '555-0301', address: '789 Pine Ln', emergency_contact: 'Linda Chen (555-0302)' },
  ],
  
  appointments: [
    { id: 'a1', patient_id: 'p1', doctor_id: 'u2', date: new Date().toISOString().split('T')[0], time_slot: '09:00 AM', status: 'scheduled', notes: 'Routine checkup' },
    { id: 'a2', patient_id: 'p2', doctor_id: 'u3', date: new Date().toISOString().split('T')[0], time_slot: '10:30 AM', status: 'scheduled', notes: 'Follow-up' },
    { id: 'a3', patient_id: 'p3', doctor_id: 'u2', date: new Date().toISOString().split('T')[0], time_slot: '02:00 PM', status: 'completed', notes: 'Initial consultation' },
  ],
  
  medical_records: [
    { id: 'm1', patient_id: 'p1', doctor_id: 'u2', visit_date: '2026-04-10', diagnosis: 'Hypertension', symptoms: 'High blood pressure, headache', treatment_plan: 'Dietary changes and medication', notes: 'Patient stable' },
  ],
  
  pharmacy_inventory: [
    { id: 'i1', medicine_name: 'Paracetamol', generic_name: 'Acetaminophen', category: 'Analgesic', quantity_in_stock: 500, unit: 'Tablets', expiry_date: '2027-12-31', reorder_level: 100 },
    { id: 'i2', medicine_name: 'Amoxicillin', generic_name: 'Amoxicillin', category: 'Antibiotic', quantity_in_stock: 250, unit: 'Capsules', expiry_date: '2026-06-30', reorder_level: 50 },
    { id: 'i3', medicine_name: 'Aspirin', generic_name: 'Acetylsalicylic Acid', category: 'Anti-inflammatory', quantity_in_stock: 120, unit: 'Tablets', expiry_date: '2028-01-15', reorder_level: 80 },
  ],
  
  invoices: [
    { id: 'inv1', patient_id: 'p1', total_amount: 1500.00, paid_amount: 1500.00, payment_status: 'paid', payment_method: 'cash', created_at: '2026-04-12T10:00:00Z' },
    { id: 'inv2', patient_id: 'p2', total_amount: 2500.00, paid_amount: 1000.00, payment_status: 'partial', payment_method: 'card', created_at: '2026-04-14T14:30:00Z' },
    { id: 'inv3', patient_id: 'p3', total_amount: 800.00, paid_amount: 0, payment_status: 'unpaid', payment_method: null, created_at: '2026-04-15T09:15:00Z' },
  ],
  
  lab_orders: [
    { id: 'l1', patient_id: 'p1', doctor_id: 'u2', test_name: 'Complete Blood Count', status: 'completed', ordered_date: '2026-04-15' },
    { id: 'l2', patient_id: 'p2', doctor_id: 'u3', test_name: 'Lipid Profile', status: 'pending', ordered_date: '2026-04-16' },
  ],

  vital_signs: [
    { id: 'v1', patient_id: 'p1', nurse_id: 'u4', temperature: 37.2, blood_pressure: '120/80', pulse_rate: 75, oxygen_saturation: 98, weight: 70, height: 175, recorded_at: new Date(Date.now() - 172800000).toISOString(), profiles: { full_name: 'Nurse Emily Brown' } },
    { id: 'v2', patient_id: 'p1', nurse_id: 'u4', temperature: 36.9, blood_pressure: '118/75', pulse_rate: 72, oxygen_saturation: 99, weight: 70, height: 175, recorded_at: new Date(Date.now() - 86400000).toISOString(), profiles: { full_name: 'Nurse Emily Brown' } },
    { id: 'v3', patient_id: 'p1', nurse_id: 'u4', temperature: 37.0, blood_pressure: '115/70', pulse_rate: 68, oxygen_saturation: 98, weight: 70, height: 175, recorded_at: new Date().toISOString(), profiles: { full_name: 'Nurse Emily Brown' } },
  ],
  
  prescriptions: [
    { 
      id: 'rx1', patient_id: 'p1', doctor_id: 'u2', status: 'pending', created_at: new Date().toISOString(),
      patients: { full_name: 'John Doe', registration_no: 'PAT-001' },
      profiles: { full_name: 'Dr. Sarah Smith' },
      prescription_items: [
        { id: 'rx_i1', prescription_id: 'rx1', medicine_name: 'Paracetamol', dosage: '500mg', frequency: 'Twice a day', duration_days: 5, quantity: 10, notes: 'After meals' },
        { id: 'rx_i2', prescription_id: 'rx1', medicine_name: 'Amoxicillin', dosage: '250mg', frequency: 'Three times a day', duration_days: 7, quantity: 21, notes: '' }
      ]
    },
    { 
      id: 'rx2', patient_id: 'p2', doctor_id: 'u3', status: 'dispensed', created_at: new Date(Date.now() - 86400000).toISOString(),
      patients: { full_name: 'Alice Johnson', registration_no: 'PAT-002' },
      profiles: { full_name: 'Dr. James Wilson' },
      prescription_items: [
        { id: 'rx_i3', prescription_id: 'rx2', medicine_name: 'Aspirin', dosage: '100mg', frequency: 'Once daily', duration_days: 30, quantity: 30, notes: 'Morning' }
      ]
    }
  ],
  
  audit_logs: [
    { id: 'log1', user_id: 'u1', action: 'INSERT', table_name: 'patients', timestamp: new Date().toISOString() },
    { id: 'log2', user_id: 'u2', action: 'UPDATE', table_name: 'appointments', timestamp: new Date().toISOString() },
  ]
};
