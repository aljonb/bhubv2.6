import Image from 'next/image';

interface ChatMessageProps {
  message: string;
  sender: 'client' | 'barber';
  timestamp: string;
  senderImage?: string;
}

export function ChatMessage({
  message,
  sender,
  timestamp,
  senderImage = '/icons/profile.svg',
}: ChatMessageProps) {
  const isClient = sender === 'client';

  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isClient && (
        <div className="mr-2 flex-shrink-0">
          <Image
            src={senderImage}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}
      <div className={`max-w-[70%]`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isClient
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--secondary)]'
          }`}
        >
          <p>{message}</p>
        </div>
        <p className="mt-1 text-xs text-gray-500">{timestamp}</p>
      </div>
      {isClient && (
        <div className="ml-2 flex-shrink-0">
          <Image
            src={senderImage}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}
    </div>
  );
} 