"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type User } from "@/lib/auth-context"
import Header from "@/components/header"
import Nav from "@/components/nav"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pencil, Trash2, Plus, AlertCircle, UserCog } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <AdminManagement />
    </ProtectedRoute>
  )
}

function AdminManagement() {
  const { getAdminUsers, addAdminUser, updateAdminUser, deleteAdminUser, getCurrentUser } = useAuth()
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "admin" as "admin" | "user",
  })
  const router = useRouter()
  const loggedInUser = getCurrentUser()
  const { toast } = useToast()

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const loadAdminUsers = async () => {
    try {
      setIsLoading(true)
      const users = await getAdminUsers()
      setAdminUsers(users)
    } catch (error) {
      console.error("Error loading admin users:", error)
      toast({
        title: "Error",
        description: "Failed to load admin users",
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

  const handleAddUser = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate form
      if (!formData.username || !formData.password || !formData.name || !formData.email) {
        setError("All fields are required")
        return
      }

      await addAdminUser({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      })

      setIsAddDialogOpen(false)
      resetForm()
      loadAdminUsers()

      toast({
        title: "Success",
        description: "Admin user added successfully",
      })
    } catch (error: any) {
      setError(error.message || "Error adding user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (user: User) => {
    setCurrentUser(user)
    setFormData({
      username: user.username,
      password: "", // Don't show the password
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "user",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      setError(null)

      // Validate form
      if (!formData.username || !formData.name || !formData.email) {
        setError("Username, name, and email are required")
        return
      }

      const updatedUserData: any = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }

      // Only update password if provided
      if (formData.password) {
        updatedUserData.password = formData.password
      }

      await updateAdminUser(currentUser.id, updatedUserData)
      setIsEditDialogOpen(false)
      resetForm()
      loadAdminUsers()

      toast({
        title: "Success",
        description: "Admin user updated successfully",
      })
    } catch (error: any) {
      setError(error.message || "Error updating user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      if (confirm("Are you sure you want to delete this user?")) {
        setIsLoading(true)
        await deleteAdminUser(id)
        loadAdminUsers()

        toast({
          title: "Success",
          description: "Admin user deleted successfully",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error deleting user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "admin",
    })
    setError(null)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <Nav />

      <div className="flex-1 p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Admin Management</h2>
              <p className="text-muted-foreground">Manage administrator accounts</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Administrators</CardTitle>
              <CardDescription>Users with administrative access to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : adminUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No admin users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{user.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <UserCog className="h-4 w-4 text-primary mr-1" />
                            <span className="capitalize">{user.role}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)} title="Edit User">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user.id !== loggedInUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={formData.username} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
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
            <Button onClick={handleAddUser} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input id="edit-username" name="username" value={formData.username} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
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
            <Button onClick={handleUpdateUser} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

