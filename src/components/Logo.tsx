import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linkToHome?: boolean;
}

export function Logo({ variant = 'icon', size = 'md', className = '', linkToHome = true }: LogoProps) {
  const sizeClasses = {
    sm: variant === 'full' ? 'h-8' : 'w-8 h-8',
    md: variant === 'full' ? 'h-12' : 'w-12 h-12',
    lg: variant === 'full' ? 'h-16' : 'w-16 h-16',
  };

  const logoElement = variant === 'full' ? (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon */}
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4C13.5066 4 5 12.0736 5 22C5 26.6878 6.76591 30.9753 9.64648 34.2468L6.5 44L16.4 40.65C19.0715 41.5117 21.9644 42 25 42C35.4934 42 44 33.9264 44 24C44 14.0736 35.4934 4 24 4Z" fill="#3c83f6"/>
        <circle cx="18" cy="24" r="3" fill="white"/>
        <circle cx="24" cy="24" r="3" fill="white"/>
        <circle cx="30" cy="24" r="3" fill="white"/>
        <circle cx="24" cy="24" r="16" fill="url(#iconGlowFull)" opacity="0.3"/>
        <defs>
          <radialGradient id="iconGlowFull" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1"/>
            <stop offset="100%" stopColor="#3c83f6" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>
      {/* Text */}
      <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#3c83f6] to-indigo-500 bg-clip-text text-transparent">
        Talkivo
      </span>
    </div>
  ) : (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4C13.5066 4 5 12.0736 5 22C5 26.6878 6.76591 30.9753 9.64648 34.2468L6.5 44L16.4 40.65C19.0715 41.5117 21.9644 42 25 42C35.4934 42 44 33.9264 44 24C44 14.0736 35.4934 4 24 4Z" fill="#3c83f6"/>
        <circle cx="18" cy="24" r="3" fill="white"/>
        <circle cx="24" cy="24" r="3" fill="white"/>
        <circle cx="30" cy="24" r="3" fill="white"/>
        <circle cx="24" cy="24" r="16" fill="url(#iconGlow)" opacity="0.3"/>
        <defs>
          <radialGradient id="iconGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1"/>
            <stop offset="100%" stopColor="#3c83f6" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="inline-block transition-opacity hover:opacity-80">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
