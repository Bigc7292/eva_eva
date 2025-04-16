'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BuildingIcon } from './icons';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linkToDashboard?: boolean;
}

export function Logo({ size = 'md', className = '', linkToDashboard = true }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  const content = (
    <div className={`flex items-center gap-2 ${className} cursor-pointer`}>
      <BuildingIcon className={`text-primary ${sizes[size]}`} />
      <span className={`bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-bold ${sizes[size]}`}>
        Top Loader Agent AI
      </span>
    </div>
  );

  if (linkToDashboard) {
    return (
      <Link href="/dashboard">
        {content}
      </Link>
    );
  }
  return content;
}

// Version that uses the image logo
export function LogoSvg({ size = 'md', className = '', linkToDashboard = true }: LogoProps) {
  // Define image dimensions based on size
  const dimensions = {
    sm: { width: 100, height: 20 },  // Smaller height
    md: { width: 140, height: 28 },  // Smaller height
    lg: { width: 180, height: 36 },  // Smaller height
  };

  const content = (
    <div className={`relative ${className} cursor-pointer`}>
      <Image
        src="https://transformed-academy-and-salon-ceo.s3.eu-north-1.amazonaws.com/ceo/WhatsApp+Image+2025-04-14+at+18.44.55.jpeg"
        alt="Top Loader Agent AI Solutions"
        width={dimensions[size].width}
        height={dimensions[size].height}
        priority
        style={{ objectFit: 'contain', objectPosition: 'left center' }}
      />
    </div>
  );

  if (linkToDashboard) {
    return (
      <Link href="/dashboard">
        {content}
      </Link>
    );
  }
  return content;
}

export default Logo;