"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getStudentByStudentId,
  addTimeRecord,
  getTimeRecordsByStudentAndDate,
  type Student,
  type TimeRecord,
} from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

export default function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [continuousMode, setContinuousMode] = useState(true)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null)
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [scanType, setScanType] = useState<"in" | "out">("in")
  const [recentScans, setRecentScans] = useState<Array<{ student: Student; type: "in" | "out"; time: Date }>>([])
  const scan = useState<Array<{ student: Student; type: "in" | "out"; time: Date }>>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanCooldownRef = useRef<boolean>(false)
  const { user } = useAuth()

  useEffect(() => {
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch((err) => {
          console.error("Error stopping scanner during cleanup:", err)
        })
      }
    }
  }, [scanning])

  const startScanner = () => {
    const html5QrCode = new Html5Qrcode("reader")
    scannerRef.current = html5QrCode

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure,
      )
      .then(() => {
        setScanning(true)
        setMessage("Scanner started. Ready to scan student IDs.")
        setMessageType("success")
      })
      .catch((err) => {
        console.error("Error starting scanner:", err)
        setMessage("Failed to start scanner. Please check camera permissions.")
        setMessageType("error")
      })
  }

  const stopScanner = () => {
    if (scannerRef.current && scanning) {
      scannerRef.current
        .stop()
        .then(() => {
          setScanning(false)
          setMessage("Scanner stopped.")
          setMessageType(null)
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err)
          setScanning(false)
        })
    } else {
      setScanning(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    // Prevent rapid scanning of the same QR code
    if (scanCooldownRef.current) return

    // Set cooldown to prevent multiple scans
    scanCooldownRef.current = true
    setTimeout(() => {
      scanCooldownRef.current = false
    }, 2000) // 2 second cooldown

    // Set scan result
    setScanResult(decodedText)
    setLastScanTime(new Date())

    try {
      // Check if QR code corresponds to a student ID
      const student = await getStudentByStudentId(decodedText)

      if (!student) {
        setMessage("Student not found with ID: " + decodedText)
        setMessageType("error")
        return
      }

      // Check if student is inactive
      if (student.status === "inactive") {
        setMessage(`${student.firstName} ${student.lastName} is inactive and cannot check in/out.`)
        setMessageType("error")
        setScannedStudent(student)
        return
      }

      setScannedStudent(student)

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]

      // Get today's records for this student
      const todayRecords = await getTimeRecordsByStudentAndDate(student.studentId, today)

      // Determine if this should be a check-in or check-out
      // If the last record was a check-in, this should be a check-out, and vice versa
      // If no records exist, this should be a check-in
      let recordType: "in" | "out" = "in"

      if (todayRecords.length > 0) {
        // Sort records by timestamp (newest first)
        const sortedRecords = [...todayRecords].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )

        // If the last record was a check-in, this should be a check-out
        recordType = sortedRecords[0].type === "in" ? "out" : "in"
      }

      // Create new time record
      const newRecord: TimeRecord = {
        id: uuidv4(),
        studentId: student.studentId,
        timestamp: new Date(),
        type: recordType,
        date: today,
      }

      await addTimeRecord(newRecord)

      // Update scan type for UI
      setScanType(recordType)

      // Add to recent scans
      setRecentScans((prev) => {
        const newScans = [{ student, type: recordType, time: new Date() }, ...prev].slice(0, 10) // Keep only the 10 most recent scans
        return newScans
      })

      setMessage(`${student.firstName} ${student.lastName} checked ${recordType} successfully!`)
      setMessageType("success")

      // If not in continuous mode, stop the scanner
      if (!continuousMode && scannerRef.current && scanning) {
        await scannerRef.current.stop()
        setScanning(false)
      }
    } catch (error) {
      console.error("Error processing scan:", error)
      setMessage("Error processing scan. Please try again.")
      setMessageType("error")
    }
  }

  const onScanFailure = (error: string) => {
    // We don't need to show errors for each frame that doesn't contain a QR code
    console.debug("No QR code found in this frame:", error)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div id="reader" className="w-full max-w-sm h-64 border rounded-lg overflow-hidden"></div>

          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center space-x-2">
              <Switch id="continuous-mode" checked={continuousMode} onCheckedChange={setContinuousMode} />
              <Label htmlFor="continuous-mode">Continuous Scanning</Label>
            </div>

            {!scanning ? (
              <Button onClick={startScanner}>Start Scanner</Button>
            ) : (
              <Button onClick={stopScanner} variant="destructive">
                Stop Scanner
              </Button>
            )}
          </div>

          {scannedStudent && lastScanTime && (
            <div
              className={`flex items-center space-x-4 p-4 ${scanType === "in" ? "bg-green-100" : "bg-red-100"} rounded-md w-full`}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={scannedStudent.photoUrl}
                  alt={`${scannedStudent.firstName} ${scannedStudent.lastName}`}
                />
                <AvatarFallback>{getInitials(scannedStudent.firstName, scannedStudent.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{`${scannedStudent.lastName}, ${scannedStudent.firstName} ${scannedStudent.middleName ? scannedStudent.middleName.charAt(0) + "." : ""}`}</h3>
                <p className="text-sm text-gray-500">{scannedStudent.studentId}</p>
                <p className="text-sm">{`${scannedStudent.yearLevel} - ${scannedStudent.course}`}</p>
                <p className={`font-medium ${scanType === "in" ? "text-green-700" : "text-red-700"}`}>
                  {scanType === "in" ? "Checked In" : "Checked Out"} at {formatTime(lastScanTime)}
                </p>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`p-4 rounded-md w-full ${messageType === "success" ? "bg-green-100 text-green-800" : messageType === "error" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
            >
              {message}
            </div>
          )}

          {recentScans.length > 0 && (
            <div className="w-full mt-4">
              <h3 className="font-medium text-lg mb-2">Recent Scans</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentScans.map((scan, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 mr-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={scan.student.photoUrl}
                                  alt={`${scan.student.firstName} ${scan.student.lastName}`}
                                />
                                <AvatarFallback>
                                  {getInitials(scan.student.firstName, scan.student.lastName)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {scan.student.lastName}, {scan.student.firstName}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scan.type === "in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                          >
                            {scan.type === "in" ? "In" : "Out"}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatTime(scan.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

