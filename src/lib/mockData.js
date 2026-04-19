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
  ],

  // TRIAGE & EMERGENCY
  triage_queue: [
    { id: 'tr1', patient_id: 'p1', arrival_time: new Date().toISOString(),
      chief_complaint: 'Chest pain and shortness of breath',
      triage_level: 'critical', vital_bp: '160/100', 
      vital_pulse: 110, vital_temp: 37.8, vital_spo2: 92,
      assigned_doctor_id: null, status: 'waiting',
      nurse_id: 'u4', created_at: new Date().toISOString() },
    { id: 'tr2', patient_id: 'p2', arrival_time: new Date(Date.now()-1800000).toISOString(),
      chief_complaint: 'High fever and severe headache',
      triage_level: 'urgent', vital_bp: '130/85',
      vital_pulse: 95, vital_temp: 39.5, vital_spo2: 97,
      assigned_doctor_id: null, status: 'waiting',
      nurse_id: 'u4', created_at: new Date().toISOString() },
    { id: 'tr3', patient_id: 'p3', arrival_time: new Date(Date.now()-3600000).toISOString(),
      chief_complaint: 'Mild sprain, right ankle',
      triage_level: 'non-urgent', vital_bp: '118/76',
      vital_pulse: 72, vital_temp: 36.8, vital_spo2: 99,
      assigned_doctor_id: null, status: 'waiting',
      nurse_id: 'u4', created_at: new Date().toISOString() },
  ],

  // SHIFT HANDOVER NOTES
  handover_notes: [
    { id: 'hn1', nurse_id: 'u4', shift: 'Morning',
      date: new Date().toISOString().split('T')[0],
      patient_updates: 'PAT-001 vitals stable. PAT-002 fever subsiding.',
      pending_tasks: 'IV replacement for PAT-003 at 18:00',
      critical_alerts: 'PAT-001 requires cardiac monitoring overnight',
      general_notes: 'Stock of saline drips running low. Notify pharmacy.',
      created_at: new Date().toISOString() },
  ],

  // MEDICATION ADMINISTRATION LOG
  medication_log: [
    { id: 'ml1', patient_id: 'p1', nurse_id: 'u4',
      medicine_name: 'Paracetamol', dosage: '500mg',
      scheduled_time: '08:00', administered_time: '08:05',
      status: 'given', notes: 'Patient tolerated well',
      created_at: new Date().toISOString() },
    { id: 'ml2', patient_id: 'p1', nurse_id: 'u4',
      medicine_name: 'Amoxicillin', dosage: '250mg',
      scheduled_time: '14:00', administered_time: null,
      status: 'pending', notes: '',
      created_at: new Date().toISOString() },
    { id: 'ml3', patient_id: 'p2', nurse_id: 'u4',
      medicine_name: 'Aspirin', dosage: '100mg',
      scheduled_time: '09:00', administered_time: null,
      status: 'overdue', notes: '',
      created_at: new Date().toISOString() },
  ],

  // VISITOR LOG
  visitor_log: [
    { id: 'vl1', visitor_name: 'Jane Doe', visitor_cnic: '35201-1234567-1',
      visitor_phone: '0300-1234567', patient_id: 'p1',
      relation: 'Wife', purpose: 'Visit', 
      time_in: new Date(Date.now()-7200000).toISOString(),
      time_out: new Date(Date.now()-3600000).toISOString(),
      status: 'checked-out', created_at: new Date().toISOString() },
    { id: 'vl2', visitor_name: 'Robert Johnson', visitor_cnic: '35201-9876543-2',
      visitor_phone: '0321-9876543', patient_id: 'p2',
      relation: 'Father', purpose: 'Visit',
      time_in: new Date(Date.now()-1800000).toISOString(),
      time_out: null, status: 'active',
      created_at: new Date().toISOString() },
  ],

  // WALK-IN QUEUE
  walkin_queue: [
    { id: 'wq1', patient_name: 'Ahmed Raza', token: 'A001',
      reason: 'Fever and cough', preferred_doctor: 'Dr. Sarah Smith',
      arrived_at: new Date(Date.now()-3600000).toISOString(),
      status: 'waiting', est_wait_mins: 20,
      created_at: new Date().toISOString() },
    { id: 'wq2', patient_name: 'Fatima Malik', token: 'A002',
      reason: 'Follow-up checkup', preferred_doctor: 'Dr. James Wilson',
      arrived_at: new Date(Date.now()-1800000).toISOString(),
      status: 'in-consultation', est_wait_mins: 0,
      created_at: new Date().toISOString() },
  ],

  // DISCHARGE RECORDS
  discharge_records: [
    { id: 'dr1', patient_id: 'p3', discharge_date: new Date().toISOString().split('T')[0],
      discharge_type: 'regular', discharging_doctor_id: 'u2',
      condition_at_discharge: 'Stable. Patient recovered well.',
      followup_date: new Date(Date.now()+604800000).toISOString().split('T')[0],
      instructions: 'Rest for 1 week. Avoid strenuous activity.',
      bill_generated: true, medicines_given: true,
      created_at: new Date().toISOString() },
  ],

  // LAB TEST CATALOG
  lab_catalog: [
    { id: 'lc1', test_name: 'Complete Blood Count', category: 'Hematology',
      price: 800, sample_type: 'Blood (EDTA)', tat_hours: 4,
      status: 'active', parameters: 'Hemoglobin, WBC, RBC, Platelets, Hematocrit' },
    { id: 'lc2', test_name: 'Lipid Profile', category: 'Biochemistry',
      price: 1200, sample_type: 'Blood (Serum)', tat_hours: 6,
      status: 'active', parameters: 'Total Cholesterol, LDL, HDL, Triglycerides' },
    { id: 'lc3', test_name: 'Liver Function Test', category: 'Biochemistry',
      price: 1500, sample_type: 'Blood (Serum)', tat_hours: 8,
      status: 'active', parameters: 'ALT, AST, ALP, Bilirubin, Albumin, Total Protein' },
    { id: 'lc4', test_name: 'Thyroid Panel', category: 'Immunology',
      price: 2000, sample_type: 'Blood (Serum)', tat_hours: 12,
      status: 'active', parameters: 'TSH, Free T3, Free T4' },
    { id: 'lc5', test_name: 'Urine Complete Examination', category: 'Urine',
      price: 400, sample_type: 'Mid-stream Urine', tat_hours: 2,
      status: 'active', parameters: 'Color, pH, Protein, Glucose, RBCs, WBCs, Casts' },
    { id: 'lc6', test_name: 'HbA1c', category: 'Biochemistry',
      price: 900, sample_type: 'Blood (EDTA)', tat_hours: 3,
      status: 'active', parameters: 'Glycated Hemoglobin %' },
    { id: 'lc7', test_name: 'Blood Culture & Sensitivity', category: 'Microbiology',
      price: 2500, sample_type: 'Blood (Sterile)', tat_hours: 72,
      status: 'active', parameters: 'Organism identification, Antibiotic sensitivity panel' },
    { id: 'lc8', test_name: 'Renal Function Test', category: 'Biochemistry',
      price: 1100, sample_type: 'Blood (Serum)', tat_hours: 5,
      status: 'active', parameters: 'Creatinine, BUN, Uric Acid, eGFR, Electrolytes' },
  ],

  // LAB REVENUE
  lab_revenue: [
    { id: 'lr1', lab_order_id: 'l1', patient_id: 'p1',
      test_name: 'Complete Blood Count', amount: 800,
      payment_method: 'cash', payment_status: 'paid',
      collected_at: new Date(Date.now()-86400000).toISOString() },
    { id: 'lr2', lab_order_id: 'l2', patient_id: 'p2',
      test_name: 'Lipid Profile', amount: 1200,
      payment_method: 'card', payment_status: 'paid',
      collected_at: new Date().toISOString() },
    { id: 'lr3', lab_order_id: null, patient_id: 'p3',
      test_name: 'Thyroid Panel', amount: 2000,
      payment_method: 'cash', payment_status: 'pending',
      collected_at: new Date().toISOString() },
  ],

  // EXPENSE RECORDS
  expenses: [
    { id: 'ex1', category: 'Utilities', description: 'Monthly electricity bill',
      amount: 45000, paid_to: 'LESCO', payment_method: 'bank_transfer',
      expense_date: '2026-04-01', approved_by: 'Admin User',
      created_at: new Date().toISOString() },
    { id: 'ex2', category: 'Medical Supplies', description: 'IV drips and syringes',
      amount: 28000, paid_to: 'MedSupply Co.', payment_method: 'cash',
      expense_date: '2026-04-05', approved_by: 'Admin User',
      created_at: new Date().toISOString() },
    { id: 'ex3', category: 'Salary', description: 'April nursing staff salary',
      amount: 180000, paid_to: 'Nursing Department', payment_method: 'bank_transfer',
      expense_date: '2026-04-10', approved_by: 'Admin User',
      created_at: new Date().toISOString() },
  ],

  // DOCTOR REFERRALS
  referrals: [
    { id: 'rf1', patient_id: 'p1', from_doctor_id: 'u2',
      to_department: 'Cardiology', reason: 'Suspected arrhythmia, needs ECG and Holter monitoring',
      urgency: 'urgent', status: 'pending',
      created_at: new Date().toISOString() },
  ],

  // INSURANCE CLAIMS
  insurance_claims: [
    { id: 'ic1', patient_id: 'p2', invoice_id: 'inv2',
      insurance_provider: 'Jubilee Life Insurance',
      policy_number: 'JLI-2024-88321', claimed_amount: 1500,
      approved_amount: 1200, received_amount: 0,
      status: 'under-review', submitted_date: '2026-04-14',
      notes: 'Pre-authorization received. Awaiting final approval.',
      created_at: new Date().toISOString() },
  ],

  // PAYROLL
  payroll: [
    { id: 'pr1', staff_id: 'u4', month: 'April', year: 2026,
      basic_salary: 45000, allowances: 5000, deductions: 2000,
      net_salary: 48000, status: 'unpaid', paid_date: null,
      created_at: new Date().toISOString() },
    { id: 'pr2', staff_id: 'u6', month: 'April', year: 2026,
      basic_salary: 55000, allowances: 8000, deductions: 3000,
      net_salary: 60000, status: 'paid',
      paid_date: '2026-04-15', created_at: new Date().toISOString() },
  ],

  // DOCTOR EARNINGS
  doctor_earnings: [
    { id: 'de1', doctor_id: 'u2', patient_id: 'p1',
      appointment_id: 'a1', consultation_fee: 2000,
      visit_date: '2026-04-16', payment_status: 'paid',
      created_at: new Date().toISOString() },
    { id: 'de2', doctor_id: 'u2', patient_id: 'p3',
      appointment_id: 'a3', consultation_fee: 2000,
      visit_date: '2026-04-15', payment_status: 'paid',
      created_at: new Date().toISOString() },
  ],

  // PURCHASE ORDERS (PHARMACY)
  purchase_orders: [
    { id: 'po1', medicine_name: 'Paracetamol',
      supplier: 'PharmaCo Pakistan', quantity: 1000,
      unit_price: 2.5, total_price: 2500,
      expected_delivery: '2026-04-22',
      status: 'confirmed', created_by: 'u6',
      created_at: new Date().toISOString() },
    { id: 'po2', medicine_name: 'Amoxicillin',
      supplier: 'MediSupply Ltd', quantity: 500,
      unit_price: 8, total_price: 4000,
      expected_delivery: '2026-04-25',
      status: 'pending', created_by: 'u6',
      created_at: new Date().toISOString() },
  ],

  // PATIENT ALLERGIES
  patient_allergies: [
    { id: 'pa1', patient_id: 'p1', allergen: 'Penicillin',
      reaction: 'Anaphylaxis', severity: 'severe',
      noted_by: 'Dr. Sarah Smith', created_at: new Date().toISOString() },
    { id: 'pa2', patient_id: 'p2', allergen: 'Sulfa drugs',
      reaction: 'Rash and itching', severity: 'moderate',
      noted_by: 'Dr. James Wilson', created_at: new Date().toISOString() },
  ],

  // BED MANAGEMENT
  bed_management: [
    { id: 'bed1', ward: 'Ward A', bed_number: 'A-01',
      status: 'occupied', patient_id: 'p1',
      admitted_date: '2026-04-12', created_at: new Date().toISOString() },
    { id: 'bed2', ward: 'Ward A', bed_number: 'A-02',
      status: 'available', patient_id: null,
      admitted_date: null, created_at: new Date().toISOString() },
    { id: 'bed3', ward: 'Ward B', bed_number: 'B-01',
      status: 'occupied', patient_id: 'p2',
      admitted_date: '2026-04-14', created_at: new Date().toISOString() },
    { id: 'bed4', ward: 'Ward B', bed_number: 'B-02',
      status: 'maintenance', patient_id: null,
      admitted_date: null, created_at: new Date().toISOString() },
    { id: 'bed5', ward: 'ICU', bed_number: 'ICU-01',
      status: 'available', patient_id: null,
      admitted_date: null, created_at: new Date().toISOString() },
    { id: 'bed6', ward: 'ICU', bed_number: 'ICU-02',
      status: 'occupied', patient_id: 'p3',
      admitted_date: '2026-04-16', created_at: new Date().toISOString() },
  ],
};
