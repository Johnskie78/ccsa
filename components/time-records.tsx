"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getTimeRecordsByDate,
  getStudents,
  updateTimeRecord,
  deleteTimeRecord,
  type TimeRecord,
  type Student,
} from "@/lib/db"
import { timeRecordsToCSV, downloadAsFile, formatDateForFilename } from "@/lib/export-utils"
import { Pencil, Trash2, Calendar, LogIn, LogOut, Clock, Filter, ChevronDown, FileDown } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Interface for paired records
interface PairedRecord {
  studentId: string
  student: Student | null
  checkIns: TimeRecord[]
  checkOuts: TimeRecord[]
  totalHours: string
}

export default function TimeRecords() {
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [studentsMap, setStudentsMap] = useState<{ [key: string]: Student }>({})
  const [pairedRecords, setPairedRecords] = useState<PairedRecord[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<TimeRecord | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [formData, setFormData] = useState({
    timestamp: "",
    type: "in" as "in" | "out",
  })
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all")

  useEffect(() => {
    loadData()
  }, [selectedDate, filterType])

  const loadData = async () => {
    try {
      const timeRecordsList = await getTimeRecordsByDate(selectedDate)

      // Apply filter if needed
      const filteredRecords =
        filterType === "all" ? timeRecordsList : timeRecordsList.filter((record) => record.type === filterType)

      // Sort records by timestamp
      const sortedRecords = filteredRecords.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )

      setRecords(sortedRecords)

      const studentsList = await getStudents()
      setStudents(studentsList)

      // Create a map of students for easier lookup
      const studentsMapObj = studentsList.reduce(
        (acc, student) => {
          acc[student.studentId] = student
          return acc
        },
        {} as { [key: string]: Student },
      )

      setStudentsMap(studentsMapObj)

      // Group and pair records by student
      const groupedByStudent = sortedRecords.reduce(
        (acc, record) => {
          if (!acc[record.studentId]) {
            acc[record.studentId] = {
              checkIns: [],
              checkOuts: [],
            }
          }

          if (record.type === "in") {
            acc[record.studentId].checkIns.push(record)
          } else {
            acc[record.studentId].checkOuts.push(record)
          }

          return acc
        },
        {} as { [key: string]: { checkIns: TimeRecord[]; checkOuts: TimeRecord[] } },
      )

      // Convert to array of paired records
      const paired = Object.entries(groupedByStudent).map(([studentId, { checkIns, checkOuts }]) => {
        const student = studentsMapObj[studentId] || null
        const totalHours = calculateTotalHours(checkIns, checkOuts)

        return {
          studentId,
          student,
          checkIns,
          checkOuts,
          totalHours,
        }
      })

      // Sort by student name
      paired.sort((a, b) => {
        if (!a.student && !b.student) return 0
        if (!a.student) return 1
        if (!b.student) return -1
        return `${a.student.lastName}, ${a.student.firstName}`.localeCompare(
          `${b.student.lastName}, ${b.student.firstName}`,
        )
      })

      setPairedRecords(paired)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const getStudent = (studentId: string) => {
    return students.find((s) => s.studentId === studentId) || null
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleEditClick = (record: TimeRecord) => {
    setCurrentRecord(record)
    setFormData({
      timestamp: new Date(record.timestamp).toISOString().slice(0, 16),
      type: record.type,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateRecord = async () => {
    if (!currentRecord) return

    try {
      const updatedRecord: TimeRecord = {
        ...currentRecord,
        timestamp: new Date(formData.timestamp),
        type: formData.type,
      }

      await updateTimeRecord(updatedRecord)
      setIsEditDialogOpen(false)
      setCurrentRecord(null)
      loadData()
    } catch (error) {
      console.error("Error updating record:", error)
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteTimeRecord(id)
        loadData()
      } catch (error) {
        console.error("Error deleting record:", error)
      }
    }
  }

  // Calculate total hours between check-ins and check-outs
  const calculateTotalHours = (checkIns: TimeRecord[], checkOuts: TimeRecord[]) => {
    let totalMilliseconds = 0

    // Create a copy of the arrays and sort by timestamp
    const sortedCheckIns = [...checkIns].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    const sortedCheckOuts = [...checkOuts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    // Pair check-ins with check-outs
    for (let i = 0; i < sortedCheckIns.length; i++) {
      const checkIn = sortedCheckIns[i]
      const checkInTime = new Date(checkIn.timestamp).getTime()

      // Find the next check-out after this check-in
      const matchingCheckOutIndex = sortedCheckOuts.findIndex((co) => new Date(co.timestamp).getTime() > checkInTime)

      if (matchingCheckOutIndex !== -1) {
        const checkOut = sortedCheckOuts[matchingCheckOutIndex]
        const checkOutTime = new Date(checkOut.timestamp).getTime()

        totalMilliseconds += checkOutTime - checkInTime

        // Remove this check-out so it's not used again
        sortedCheckOuts.splice(matchingCheckOutIndex, 1)
      }
    }

    // Convert milliseconds to hours and minutes
    const totalHours = Math.floor(totalMilliseconds / (1000 * 60 * 60))
    const totalMinutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60))

    return `${totalHours}h ${totalMinutes}m`
  }

  // Export data as CSV
  const exportToCSV = () => {
    const csvData = timeRecordsToCSV(records, studentsMap)
    const filename = `time-records-${formatDateForFilename(new Date(selectedDate))}.csv`
    downloadAsFile(csvData, filename, "text/csv;charset=utf-8;")
  }

  // Format paired check-ins and check-outs for display
  const formatPairedTimes = (records: TimeRecord[]) => {
    if (records.length === 0) return "-"

    return records
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((record) => formatTime(record.timestamp))
      .join(", ")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Time Records</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="date-select" className="sr-only">
              Select Date
            </Label>
            <Input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                {filterType === "all" ? "All Records" : filterType === "in" ? "Check-ins Only" : "Check-outs Only"}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType("all")}>All Records</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("in")}>Check-ins Only</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("out")}>Check-outs Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center">
            <FileDown className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>
            Records for{" "}
            {new Date(selectedDate).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pairedRecords.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No time records found for this date.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <LogIn className="h-4 w-4 text-green-500 mr-1" />
                        Check In
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 text-red-500 mr-1" />
                        Check Out
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Total Time
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairedRecords.map((paired) => {
                    const { student, studentId, checkIns, checkOuts, totalHours } = paired
                    return (
                      <TableRow key={studentId}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={student?.photoUrl}
                                alt={student ? `${student.firstName} ${student.lastName}` : "Unknown"}
                              />
                              <AvatarFallback>
                                {student ? getInitials(student.firstName, student.lastName) : "UN"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              {student ? (
                                <div className="font-medium">{`${student.lastName}, ${student.firstName} ${student.middleName ? student.middleName.charAt(0) + "." : ""}`}</div>
                              ) : (
                                <div className="font-medium text-gray-500">Unknown Student</div>
                              )}
                              <div className="text-xs text-gray-500">{studentId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-green-600">{formatPairedTimes(checkIns)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-red-600">{formatPairedTimes(checkOuts)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{totalHours}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {checkIns.map((record) => (
                                <DropdownMenuItem key={`in-${record.id}`} className="flex justify-between">
                                  <span className="flex items-center">
                                    <LogIn className="h-4 w-4 text-green-500 mr-1" />
                                    {formatTime(record.timestamp)}
                                  </span>
                                  <span className="flex">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(record)}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(record.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </span>
                                </DropdownMenuItem>
                              ))}
                              {checkOuts.map((record) => (
                                <DropdownMenuItem key={`out-${record.id}`} className="flex justify-between">
                                  <span className="flex items-center">
                                    <LogOut className="h-4 w-4 text-red-500 mr-1" />
                                    {formatTime(record.timestamp)}
                                  </span>
                                  <span className="flex">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(record)}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(record.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="timestamp">Timestamp</Label>
              <Input
                id="timestamp"
                name="timestamp"
                type="datetime-local"
                value={formData.timestamp}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Record Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange("type", value as "in" | "out")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Check In</SelectItem>
                  <SelectItem value="out">Check Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRecord}>Update Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

