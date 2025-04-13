import Image from 'next/image';
import Link from 'next/link';

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export function DashboardCard({ title, description, href, icon }: DashboardCardProps) {
  return (
    <Link href={href} className="group">
      <div className="card flex flex-col items-center justify-center gap-4 text-center hover:border-[var(--primary)] hover:shadow-md transition-all p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]">
          <Image src={icon} alt={title} width={24} height={24} />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
} 