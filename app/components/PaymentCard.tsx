import Image from 'next/image';

interface PaymentCardProps {
  id: string;
  date: string;
  service: string;
  barberName: string;
  amount: number;
  tip?: number;
  total: number;
  paymentMethod: 'card' | 'cash' | 'apple_pay' | 'google_pay' | 'unknown';
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  receiptUrl?: string;
  appointmentId?: string;
  stripePaymentIntentId: string;
  barberImage?: string;
}

export function PaymentCard({
  id: _,
  date,
  service,
  barberName,
  amount: _amount,
  tip = 0,
  total,
  paymentMethod,
  status: _status,
  receiptUrl,
  barberImage = '/icons/profile.svg',
}: PaymentCardProps) {
  const paymentMethodIcon = {
    card: '/icons/credit-card.svg',
    cash: '/icons/dollar-sign.svg',
    apple_pay: '/icons/apple.svg',
    google_pay: '/icons/google.svg',
    unknown: '/icons/credit-card.svg',
  };

  const paymentMethodLabel = {
    card: 'Card',
    cash: 'Cash',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    unknown: 'Unknown',
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
        <p className="text-sm mt-1 text-gray-600">{date}</p>
      </div>

      <div className="flex flex-col items-center gap-2 md:items-end">
        <div className="flex items-center gap-2">
          <Image
            src={paymentMethodIcon[paymentMethod]}
            alt={paymentMethodLabel[paymentMethod]}
            width={16}
            height={16}
          />
          <span className="text-sm font-medium">{paymentMethodLabel[paymentMethod]}</span>
        </div>
        <div className="text-center md:text-right">
          <p className="text-lg font-semibold">${total.toFixed(2)}</p>
          {tip > 0 && (
            <p className="text-xs text-gray-500">
              Includes ${tip.toFixed(2)} tip
            </p>
          )}
        </div>
        {receiptUrl ? (
          <a 
            href={receiptUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary btn-sm mt-2 inline-block text-center"
          >
            View Receipt
          </a>
        ) : (
          <button className="btn-secondary btn-sm mt-2" disabled>
            No Receipt
          </button>
        )}
      </div>
    </div>
  );
} 