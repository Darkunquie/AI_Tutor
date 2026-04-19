import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linkToHome?: boolean;
}

const ICON_SIZES = { sm: 28, md: 36, lg: 48 };

export function Logo({ variant = 'icon', size = 'md', className = '', linkToHome = true }: LogoProps) {
  const px = ICON_SIZES[size];

  const logoElement = variant === 'full' ? (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image src="/logo.png" alt="Talkivo" width={px} height={px} className="object-contain" />
      <span className="font-serif text-[20px] tracking-tight text-[#f2be8c]">Talkivo</span>
    </div>
  ) : (
    <div className={className}>
      <Image src="/logo.png" alt="Talkivo" width={px} height={px} className="object-contain" />
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="inline-flex items-center transition-opacity hover:opacity-80">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
