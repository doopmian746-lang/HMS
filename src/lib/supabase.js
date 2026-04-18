// Mock Supabase Client for Frontend-Only Development
import { MOCK_DATA } from './mockData'

class MockSupabaseClient {
  constructor() {
    this.auth = new MockAuth()
    this.currentTable = null
    this.currentData = []
    this.isSingle = false
  }

  from(tableName) {
    this.currentTable = tableName
    this.currentData = [...(MOCK_DATA[tableName] || [])]
    this.isSingle = false
    return this
  }

  select(query = '*') {
    // Basic select simulation
    // In a real mock we might handle joins here, but let's keep it simple
    return this
  }

  eq(column, value) {
    this.currentData = this.currentData.filter(item => item[column] === value)
    return this
  }

  ilike(column, pattern) {
    const regexps = pattern.replace(/%/g, '.*')
    const regex = new RegExp(`^${regexps}$`, 'i')
    this.currentData = this.currentData.filter(item => 
      item[column] && regex.test(item[column].toString())
    )
    return this
  }

  or(queryStr) {
    // Basic mock implementation of .or('col1.ilike.%val%,col2.eq.val')
    // For now we just implement a very rudimentary pass-through to avoid crashing
    // The user will see 'some' data or all data unless we implement full parsing.
    return this
  }

  order(column, { ascending = true } = {}) {
    this.currentData.sort((a, b) => {
      if (a[column] < b[column]) return ascending ? -1 : 1
      if (a[column] > b[column]) return ascending ? 1 : -1
      return 0
    })
    return this
  }

  limit(count) {
    this.currentData = this.currentData.slice(0, count)
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  maybeSingle() {
    this.isSingle = true
    return this
  }

  async insert(newData) {
    const records = Array.isArray(newData) ? newData : [newData]
    const insertedRecords = []
    records.forEach(r => {
      const id = r.id || Math.random().toString(36).substr(2, 9)
      const newRecord = { ...r, id }
      this.currentData.push(newRecord)
      if (MOCK_DATA[this.currentTable]) {
        MOCK_DATA[this.currentTable].push(newRecord)
      }
      insertedRecords.push(newRecord)
    })
    
    // Simulate chainable promise
    const result = { data: records.length === 1 ? insertedRecords[0] : insertedRecords, error: null }
    const p = Promise.resolve(result)
    p.select = () => p
    p.single = () => p
    p.maybeSingle = () => p
    return p
  }

  async upsert(newData) {
    return this.insert(newData)
  }

  async update(updateData) {
    // Simplified update mock
    const p = Promise.resolve({ data: updateData, error: null })
    p.select = () => p
    p.single = () => p
    return p
  }

  async delete() {
    return { data: null, error: null }
  }

  // Terminal methods that return the result
  async then(resolve) {
    const result = this.isSingle ? (this.currentData[0] || null) : this.currentData
    const count = this.currentData.length
    resolve({ data: result, count, error: null })
  }
}

class MockAuth {
  async getSession() {
    const sessionStr = sessionStorage.getItem('hms_session')
    return { data: { session: sessionStr ? JSON.parse(sessionStr) : null }, error: null }
  }

  async getUser() {
    const sessionStr = sessionStorage.getItem('hms_session')
    return { data: { user: sessionStr ? JSON.parse(sessionStr).user : null }, error: null }
  }

  async signInWithPassword({ email, password }) {
    // Flexible mock login: email determines role
    // e.g. admin@test.com, doctor@test.com, staff@test.com
    let role = 'receptionist'
    if (email.includes('admin')) role = 'admin'
    else if (email.includes('doctor')) role = 'doctor'
    else if (email.includes('nurse')) role = 'nurse'
    else if (email.includes('pharmacy')) role = 'pharmacy'
    else if (email.includes('lab')) role = 'laboratory'
    else if (email.includes('account')) role = 'accounts'
    else if (email.includes('staff')) role = 'staff'

    const user = {
      id: 'u_' + Math.random().toString(36).substr(2, 5),
      email,
      user_metadata: {
        full_name: email.split('@')[0].toUpperCase(),
        role: role
      }
    }

    const session = { user, access_token: 'mock_token_' + Date.now() }
    sessionStorage.setItem('hms_session', JSON.stringify(session))
    
    return { data: { user, session }, error: null }
  }

  async signOut() {
    sessionStorage.removeItem('hms_session')
    return { error: null }
  }

  onAuthStateChange(callback) {
    // Basic event simulator
    const sessionStr = sessionStorage.getItem('hms_session')
    const session = sessionStr ? JSON.parse(sessionStr) : null
    callback('SIGNED_IN', session)
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
}

export const supabase = new MockSupabaseClient()
