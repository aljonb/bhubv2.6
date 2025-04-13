import Image from 'next/image';

interface PaymentCardProps {
  id: string;
  date: string;
  service: string;
  barberName: string;
  amount: number;
  tip?: number;
  paymentMethod: 'card' | 'cash' | 'apple_pay';
  barberImage?: string;
}

export function PaymentCard({
  id,
  date,
  service,
  barberName,
  amount,
  tip = 0,
  paymentMethod,
  barberImage = '/icons/profile.svg',
}: PaymentCardProps) {
  const paymentMethodIcon = {
    card: '/icons/credit-card.svg',
    cash: '/icons/dollar-sign.svg',
    apple_pay: '/icons/apple.svg',
  };

  const paymentMethodLabel = {
    card: 'Card',
    cash: 'Cash',
    apple_pay: 'Apple Pay',
  };

  const total = amount + tip;

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
        <button className="btn-secondary btn-sm mt-2">View Receipt</button>
      </div>
    </div>
  );
} 