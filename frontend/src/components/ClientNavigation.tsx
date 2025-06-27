'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Satellites', href: '/satellites' },
  { name: 'Risk Assessment', href: '/risks' },
  { name: 'Space Weather', href: '/weather' },
];

export default function ClientNavigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center space-x-8">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'text-gray-600 hover:text-blue-600 transition-colors font-medium',
              isActive && 'text-blue-600 font-semibold'
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
} 