import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Clock, CheckCircle2, AlertCircle, Wrench, RefreshCw, Smartphone, Laptop, Tablet, Gamepad2, Cpu } from 'lucide-react';

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

const SERVICE_CATEGORIES = [
  { id: 'Smartphone Repair', icon: Smartphone, label: 'Smartphone' },
  { id: 'Laptop/PC Repair', icon: Laptop, label: 'Laptop/PC' },
  { id: 'Tablet Repair', icon: Tablet, label: 'Tablet' },
  { id: 'Console Repair', icon: Gamepad2, label: 'Console' },
  { id: 'Other Electronics', icon: Cpu, label: 'Other' },
];

export function UserDashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  
  // Form State
  const [serviceType, setServiceType] = useState('Smartphone Repair');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid)
    );

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
  }, [user]);

  const openCreateModal = () => {
    setServiceType('Smartphone Repair');
    setDescription('');
    setDate('');
    setTime('');
    setIsModalOpen(true);
  };

  const openEditModal = (booking: Booking) => {
    setServiceType(booking.serviceType);
    setDescription(booking.description);
    setDate(booking.date);
    setTime(booking.time);
    setEditingBookingId(booking.id);
    setIsEditModalOpen(true);
  };

  const handleRebook = () => {
    if (!selectedBooking) return;
    setServiceType(selectedBooking.serviceType);
    setDescription(selectedBooking.description);
    setDate('');
    setTime('');
    setIsDetailsModalOpen(false);
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookingId) return;

    try {
      await updateDoc(doc(db, 'bookings', editingBookingId), {
        serviceType,
        description,
        date,
        time,
      });
      toast.success('Booking updated successfully!');
      setIsEditModalOpen(false);
      setEditingBookingId(null);
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error('Failed to update booking');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      const newBooking = {
        userId: user.uid,
        userName: profile.name,
        serviceType,
        description,
        date,
        time,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Add to Firestore. We don't set the ID here, Firestore generates it.
      // But our rules require 'id' field to be present and match the doc ID.
      // So we use a two-step process or generate an ID first.
      const docRef = doc(collection(db, 'bookings'));
      await setDoc(docRef, { ...newBooking, id: docRef.id });

      toast.success('Booking created successfully!');
      setIsModalOpen(false);
      
      // Reset form
      setDescription('');
      setDate('');
      setTime('');
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error('Failed to create booking');
    }
  };

  const confirmCancel = (id: string) => {
    setBookingToCancel(id);
    setIsCancelModalOpen(true);
  };

  const executeCancel = async () => {
    if (!bookingToCancel) return;
    
    try {
      await deleteDoc(doc(db, 'bookings', bookingToCancel));
      toast.success('Booking cancelled');
      setIsCancelModalOpen(false);
      setBookingToCancel(null);
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error('Failed to cancel booking');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'in-progress');
  const historyBookings = bookings.filter(b => b.status === 'completed');
  const displayedBookings = activeTab === 'active' ? activeBookings : historyBookings;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Book Repair
        </Button>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('active')}
        >
          Active Bookings
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('history')}
        >
          Booking History
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayedBookings.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'active' ? 'No active bookings' : 'No booking history'}
            </h3>
            <p className="text-gray-500 mt-1">
              {activeTab === 'active' ? 'Create your first repair booking to get started.' : 'Completed bookings will appear here.'}
            </p>
            {activeTab === 'active' && (
              <Button onClick={openCreateModal} className="mt-4" variant="outline">
                Book a Service
              </Button>
            )}
          </div>
        ) : (
          displayedBookings.map((booking) => (
            <Card 
              key={booking.id} 
              className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedBooking(booking);
                setIsDetailsModalOpen(true);
              }}
            >
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{booking.serviceType}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(booking.date), 'MMM d, yyyy')} at {booking.time}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusBadge(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span className="capitalize">{booking.status}</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <p className="text-sm text-gray-700 line-clamp-3">{booking.description}</p>
              </CardContent>
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                {booking.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(booking);
                      }} 
                      className="gap-1.5"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmCancel(booking.id);
                      }} 
                      className="gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Book Repair Service">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isSelected = serviceType === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setServiceType(category.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="text-xs font-medium text-center">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="Please describe the issue with your device..."
              required
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Booking Details">
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedBooking.serviceType}</h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(selectedBooking.date), 'MMMM d, yyyy')} at {selectedBooking.time}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusBadge(selectedBooking.status)}`}>
                {getStatusIcon(selectedBooking.status)}
                <span className="capitalize">{selectedBooking.status}</span>
              </span>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Issue Description</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedBooking.description}</p>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Booking Reference</h4>
              <p className="text-xs font-mono text-gray-500">{selectedBooking.id}</p>
              <p className="text-xs text-gray-500 mt-1">Created on {format(new Date(selectedBooking.createdAt), 'MMM d, yyyy h:mm a')}</p>
            </div>
            
            <div className="pt-4 border-t flex justify-end gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={handleRebook} 
                className="gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Rebook Service
              </Button>
              {selectedBooking.status === 'pending' && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      openEditModal(selectedBooking);
                    }} 
                    className="gap-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Booking
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      confirmCancel(selectedBooking.id);
                    }} 
                    className="gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel Booking
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Booking">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isSelected = serviceType === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setServiceType(category.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="text-xs font-medium text-center">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="Please describe the issue with your device..."
              required
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Booking">
        <div className="space-y-4">
          <p className="text-gray-700">Are you sure you want to cancel this booking? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              No, Keep it
            </Button>
            <Button variant="destructive" onClick={executeCancel}>
              Yes, Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
