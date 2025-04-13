'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Services offered by the barbershop
const services = [
  { id: 'haircut', name: 'Haircut', price: 30 },
  { id: 'beard-trim', name: 'Beard Trim', price: 15 },
  { id: 'haircut-beard', name: 'Haircut & Beard Trim', price: 40 },
  { id: 'hair-color', name: 'Hair Coloring', price: 60 },
  { id: 'shave', name: 'Traditional Shave', price: 25 },
];

// Barbers at the shop
const barbers = [
  { id: '1', name: 'Mike Johnson', image: 'https://randomuser.me/api/portraits/men/32.jpg', available: true },
  { id: '2', name: 'David Smith', image: 'https://randomuser.me/api/portraits/men/44.jpg', available: true },
  { id: '3', name: 'Sarah Wilson', image: 'https://randomuser.me/api/portraits/women/65.jpg', available: false },
];

// Available time slots
const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

export default function BookAppointment() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically call your API to book the appointment
    // For now, we'll just redirect back to the appointments page
    
    alert('Appointment booked successfully!');
    router.push('/appointments');
  };
  
  // Format dates for the date input min value (today)
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8">Book an Appointment</h1>
      
      <form onSubmit={handleBooking} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Select a Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
              <div
                key={service.id}
                className={`card p-4 cursor-pointer hover:border-[var(--primary)] transition-colors ${
                  selectedService === service.id ? 'border-[var(--primary)] bg-[var(--accent)]' : ''
                }`}
                onClick={() => setSelectedService(service.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-500">${service.price}</p>
                  </div>
                  {selectedService === service.id && (
                    <div className="h-5 w-5 rounded-full bg-[var(--primary)]"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Select a Barber</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {barbers.map(barber => (
              <div
                key={barber.id}
                className={`card p-4 cursor-pointer hover:border-[var(--primary)] transition-colors ${
                  !barber.available ? 'opacity-50 cursor-not-allowed' : ''
                } ${selectedBarber === barber.id ? 'border-[var(--primary)] bg-[var(--accent)]' : ''}`}
                onClick={() => barber.available && setSelectedBarber(barber.id)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={barber.image}
                      alt={barber.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-medium">{barber.name}</h3>
                  {!barber.available && <p className="text-xs text-gray-500">Unavailable</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Select Date & Time</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                min={formattedToday}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-md border-[var(--secondary)] p-2"
                required
              />
            </div>
            
            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-2">
                Time
              </label>
              <select
                id="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full rounded-md border-[var(--secondary)] p-2"
                required
              >
                <option value="">Select a time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!selectedService || !selectedBarber || !selectedDate || !selectedTime}
          >
            Book Appointment
          </button>
        </div>
      </form>
    </div>
  );
} 