import Image from 'next/image';

interface AppointmentCardProps {
  service: string;
  barberName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  barberImage?: string;
}

export function AppointmentCard({ 
  service, 
  barberName, 
  date, 
  time, 
  status,
  barberImage = '/icons/profile.svg' 
}: AppointmentCardProps) {
  const statusBadge = {
    confirmed: <span className="badge badge-success">Confirmed</span>,
    pending: <span className="badge badge-pending">Pending</span>,
    cancelled: <span className="badge bg-red-100 text-red-800">Cancelled</span>
  };

  return (
    <div className="card flex flex-col md:flex-row items-center md:items-start gap-4 p-4">
      <div className="relative h-14 w-14 overflow-hidden rounded-full">
        <Image 
          src={barberImage} 
          alt={barberName} 
          width={56} 
          height={56} 
          className="object-cover"
        />
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <h3 className="text-lg font-semibold">{service}</h3>
        <p className="text-sm text-gray-500">{barberName}</p>
        <p className="text-sm mt-1 text-gray-600">{date} at {time}</p>
      </div>

      <div className="flex flex-col items-center gap-2 md:items-end">
        {statusBadge[status]}
        <div className="flex gap-2 mt-2">
          <button className="btn-secondary btn-sm">View</button>
          {status !== 'cancelled' && (
            <button className="btn-secondary btn-sm text-red-500">Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
} 