"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { readFileAsDataURL } from "@/lib/qr-utils"
import { Pencil, Trash2, Plus, UserCheck, UserX, QrCode, Upload } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import QRCodeGenerator from "./qr-code-generator"
import { useToast } from "@/hooks/use-toast"

interface Student {
  _id: string
  studentId: string
  lastName: string
  firstName: string
  middleName: string
  yearLevel: string
  course: string
  status: "active" | "inactive"
  photoUrl: string
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    studentId: "",
    yearLevel: "",
    course: "",
    status: "active",
    photoUrl: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/students")

      if (!response.ok) {
        throw new Error("Failed to load students")
      }

      const data = await response.json()
      setStudents(data.students)
    } catch (error) {
      console.error("Error loading students:", error)
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const dataUrl = await readFileAsDataURL(file)
        setFormData({
          ...formData,
          photoUrl: dataUrl,
        })
      } catch (error) {
        console.error("Error reading file:", error)
      }
    }
  }

  const handleAddStudent = async () => {
    try {
      setIsLoading(true)

      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.studentId || !formData.yearLevel || !formData.course) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const newStudent = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        studentId: formData.studentId,
        yearLevel: formData.yearLevel,
        course: formData.course,
        status: formData.status as "active" | "inactive",
        photoUrl: formData.photoUrl || "/placeholder.svg?height=100&width=100",
      }

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStudent),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add student")
      }

      setIsAddDialogOpen(false)
      resetForm()
      loadStudents()

      toast({
        title: "Success",
        description: "Student added successfully",
      })
    } catch (error: any) {
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (student: Student) => {
    setCurrentStudent(student)
    setFormData({
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      studentId: student.studentId,
      yearLevel: student.yearLevel,
      course: student.course,
      status: student.status,
      photoUrl: student.photoUrl,
    })
    setIsEditDialogOpen(true)
  }

  const handleQRCodeClick = (student: Student) => {
    setCurrentStudent(student)
    setIsQRDialogOpen(true)
  }

  const handleUpdateStudent = async () => {
    if (!currentStudent) return

    try {
      setIsLoading(true)

      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.studentId || !formData.yearLevel || !formData.course) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const updatedStudent = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        studentId: formData.studentId,
        yearLevel: formData.yearLevel,
        course: formData.course,
        status: formData.status as "active" | "inactive",
        photoUrl: formData.photoUrl || currentStudent.photoUrl,
      }

      const response = await fetch(`/api/students/${currentStudent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedStudent),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update student")
      }

      setIsEditDialogOpen(false)
      setCurrentStudent(null)
      resetForm()
      loadStudents()

      toast({
        title: "Success",
        description: "Student updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating student:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        setIsLoading(true)

        const response = await fetch(`/api/students/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to delete student")
        }

        loadStudents()

        toast({
          title: "Success",
          description: "Student deleted successfully",
        })
      } catch (error: any) {
        console.error("Error deleting student:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete student",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      studentId: "",
      yearLevel: "",
      course: "",
      status: "active",
      photoUrl: "",
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={formData.photoUrl || "/placeholder.svg?height=100&width=100"}
                      alt="Student photo"
                    />
                    <AvatarFallback>
                      {formData.firstName && formData.lastName
                        ? getInitials(formData.firstName, formData.lastName)
                        : "ST"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" name="middleName" value={formData.middleName} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input id="studentId" name="studentId" value={formData.studentId} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearLevel">Year Level</Label>
                  <Select value={formData.yearLevel} onValueChange={(value) => handleSelectChange("yearLevel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Year</SelectItem>
                      <SelectItem value="2nd">2nd Year</SelectItem>
                      <SelectItem value="3rd">3rd Year</SelectItem>
                      <SelectItem value="4th">4th Year</SelectItem>
                      <SelectItem value="5th">5th Year</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input id="course" name="course" value={formData.course} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsAddDialogOpen(false)
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleAddStudent} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Year & Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No students found. Add a student to get started.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                      <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{`${student.lastName}, ${student.firstName} ${student.middleName ? student.middleName.charAt(0) + "." : ""}`}</div>
                  </TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>{`${student.yearLevel} - ${student.course}`}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {student.status === "active" ? (
                        <>
                          <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-500">Active</span>
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-red-500">Inactive</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQRCodeClick(student)}
                      title="Generate QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(student)} title="Edit Student">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStudent(student._id)}
                      title="Delete Student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.photoUrl || "/placeholder.svg?height=100&width=100"} alt="Student photo" />
                  <AvatarFallback>
                    {formData.firstName && formData.lastName
                      ? getInitials(formData.firstName, formData.lastName)
                      : "ST"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input id="edit-firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-middleName">Middle Name</Label>
                <Input
                  id="edit-middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input id="edit-lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-studentId">Student ID</Label>
              <Input id="edit-studentId" name="studentId" value={formData.studentId} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-yearLevel">Year Level</Label>
                <Select value={formData.yearLevel} onValueChange={(value) => handleSelectChange("yearLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                    <SelectItem value="5th">5th Year</SelectItem>
                    <SelectItem value="Graduate">Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-course">Course</Label>
                <Input id="edit-course" name="course" value={formData.course} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setIsEditDialogOpen(false)
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStudent} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Student QR Code</DialogTitle>
          </DialogHeader>
          {currentStudent && (
            <div className="py-4 flex flex-col items-center">
              <Avatar className="h-16 w-16 mb-2">
                <AvatarImage
                  src={currentStudent.photoUrl}
                  alt={`${currentStudent.firstName} ${currentStudent.lastName}`}
                />
                <AvatarFallback>{getInitials(currentStudent.firstName, currentStudent.lastName)}</AvatarFallback>
              </Avatar>
              <h3 className="font-medium text-lg mb-4">{`${currentStudent.lastName}, ${currentStudent.firstName} ${currentStudent.middleName ? currentStudent.middleName.charAt(0) + "." : ""}`}</h3>
              <QRCodeGenerator
                value={currentStudent.studentId}
                label={`${currentStudent.firstName} ${currentStudent.lastName}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

