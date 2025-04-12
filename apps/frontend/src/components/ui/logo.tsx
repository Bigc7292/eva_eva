'use client';

import Image from 'next/image';
import { BuildingIcon } from './icons';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BuildingIcon className={`text-primary ${sizes[size]}`} />
      <span className={`bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-bold ${sizes[size]}`}>
        Eva CRM
      </span>
    </div>
  );
}

// We can also create a version that uses the SVG logo
export function LogoSvg({ size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: 'w-20',
    md: 'w-24',
    lg: 'w-32',
  };

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <Image
        src="/images/eva-logo.svg"
        alt="Eva CRM"
        width={100}
        height={35}
        priority
        className="dark:invert"
      />
    </div>
  );
}

export default Logo;