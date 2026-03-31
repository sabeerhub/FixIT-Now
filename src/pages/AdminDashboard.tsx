import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Trash2, Edit2, CheckCircle2, Clock, AlertCircle, Filter, User as UserIcon, List, Wrench, Download } from 'lucide-react';

interface Booking {
  id: string;
  userId: string;
  userName: string;
  serviceType: string;
  description: string;
  date: string;
  time: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

interface UserDetails {
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function AdminDashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const q = query(collection(db, 'bookings'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData: Booking[] = [];
      snapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
      });
      // Sort by date descending
      bookingsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status: newStatus
      });
      toast.success(`Booking marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('Failed to update status');
    }
  };

  const confirmDelete = (id: string) => {
    setBookingToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!bookingToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'bookings', bookingToDelete));
      toast.success('Booking deleted');
      setIsDeleteModalOpen(false);
      setBookingToDelete(null);
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error('Failed to delete booking');
    }
  };

  const handleViewUser = async (userId: string) => {
    setLoadingUser(true);
    setIsUserModalOpen(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setSelectedUser(userDoc.data() as UserDetails);
      } else {
        toast.error('User not found');
        setIsUserModalOpen(false);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error('Failed to fetch user details');
      setIsUserModalOpen(false);
    } finally {
      setLoadingUser(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Booking ID', 'Customer Name', 'Service Type', 'Date', 'Time', 'Status', 'Description', 'Created At'];
      
      const csvRows = bookings.map(b => {
        return [
          b.id,
          `"${b.userName.replace(/"/g, '""')}"`,
          `"${b.serviceType}"`,
          b.date,
          b.time,
          b.status,
          `"${b.description.replace(/"/g, '""')}"`,
          format(new Date(b.createdAt), 'yyyy-MM-dd HH:mm:ss')
        ].join(',');
      });
      
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Bookings exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export bookings');
    }
  };

  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const inProgressBookings = bookings.filter(b => b.status === 'in-progress').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} className="gap-2 bg-white">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <Filter className="w-4 h-4 text-gray-500 ml-2" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 py-1 pr-8 text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalBookings}</h3>
            </div>
            <div className="p-3 bg-gray-100 rounded-full text-gray-600">
              <List className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <h3 className="text-2xl font-bold text-gray-900">{pendingBookings}</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <h3 className="text-2xl font-bold text-gray-900">{inProgressBookings}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <h3 className="text-2xl font-bold text-gray-900">{completedBookings}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Service</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No bookings found matching the selected filter.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.userName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]" title={booking.description}>
                        {booking.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.serviceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>{format(new Date(booking.date), 'MMM d, yyyy')}</div>
                      <div className="text-gray-500">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        <span className="capitalize">{booking.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-2">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                          className="text-xs border-gray-300 rounded-md py-1 pl-2 pr-6 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewUser(booking.userId)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                          title="View User Details"
                        >
                          <UserIcon className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => confirmDelete(booking.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of <span className="font-medium">{filteredBookings.length}</span> bookings
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="User Details">
        {loadingUser ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : selectedUser ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <div className="mt-1 text-gray-900 font-medium">{selectedUser.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <div className="mt-1 text-gray-900">{selectedUser.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Role</label>
              <div className="mt-1 text-gray-900 capitalize">{selectedUser.role}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Member Since</label>
              <div className="mt-1 text-gray-900">
                {format(new Date(selectedUser.createdAt), 'MMMM d, yyyy h:mm a')}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">User details not available.</div>
        )}
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Booking">
        <div className="space-y-4">
          <p className="text-gray-700">Are you sure you want to delete this booking? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeDelete}>
              Yes, Delete Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
