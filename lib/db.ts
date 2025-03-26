// IndexedDB database utility

export interface Student {
  id: string
  studentId: string
  lastName: string
  firstName: string
  middleName: string
  yearLevel: string
  course: string
  status: "active" | "inactive"
  photoUrl: string
}

export interface TimeRecord {
  id: string
  studentId: string
  timestamp: Date
  type: "in" | "out" // Type of record: check-in or check-out
  date: string // YYYY-MM-DD format for easy filtering
}

const DB_NAME = "StudentTimeTrackingDB"
const DB_VERSION = 4 // Increased version for schema update
const STUDENTS_STORE = "students"
const TIME_RECORDS_STORE = "timeRecords"

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      reject("Database error: " + (event.target as IDBOpenDBRequest).error)
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create or update students store
      if (!db.objectStoreNames.contains(STUDENTS_STORE)) {
        const studentsStore = db.createObjectStore(STUDENTS_STORE, { keyPath: "id" })
        studentsStore.createIndex("studentId", "studentId", { unique: true })
        studentsStore.createIndex("lastName", "lastName", { unique: false })
        studentsStore.createIndex("status", "status", { unique: false })
      }

      // Create or update time records store
      if (!db.objectStoreNames.contains(TIME_RECORDS_STORE)) {
        const timeRecordsStore = db.createObjectStore(TIME_RECORDS_STORE, { keyPath: "id" })
        timeRecordsStore.createIndex("studentId", "studentId", { unique: false })
        timeRecordsStore.createIndex("date", "date", { unique: false })
        timeRecordsStore.createIndex("type", "type", { unique: false })
        timeRecordsStore.createIndex("studentId_date", ["studentId", "date"], { unique: false })
      } else if (event.oldVersion < 4) {
        // If upgrading from version 3, we need to handle existing data
        const transaction = event.target.transaction

        // Check if the transaction exists and has the TIME_RECORDS_STORE
        if (transaction && transaction.objectStore) {
          const store = transaction.objectStore(TIME_RECORDS_STORE)

          // Add new indexes if they don't exist
          if (!store.indexNames.contains("type")) {
            store.createIndex("type", "type", { unique: false })
          }
          if (!store.indexNames.contains("studentId_date")) {
            store.createIndex("studentId_date", ["studentId", "date"], { unique: false })
          }
        }
      }
    }
  })
}

// Student CRUD operations remain the same
export async function addStudent(student: Student): Promise<string> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readwrite")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.add(student)

    request.onsuccess = () => resolve(student.id)
    request.onerror = () => reject(request.error)
  })
}

export async function getStudents(): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getStudentByStudentId(studentId: string): Promise<Student | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("studentId")
    const request = index.get(studentId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getStudentById(id: string): Promise<Student | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function updateStudent(student: Student): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readwrite")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.put(student)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteStudent(id: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readwrite")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Updated Time Records CRUD operations
export async function addTimeRecord(record: TimeRecord): Promise<string> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.add(record)

    request.onsuccess = () => resolve(record.id)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecords(): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecordsByDate(date: string): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const index = store.index("date")
    const request = index.getAll(date)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecordsByStudentId(studentId: string): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const index = store.index("studentId")
    const request = index.getAll(studentId)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecordsByStudentAndDate(studentId: string, date: string): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const index = store.index("studentId_date")
    const request = index.getAll([studentId, date])

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecord(id: string): Promise<TimeRecord | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function updateTimeRecord(record: TimeRecord): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.put(record)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteTimeRecord(id: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

