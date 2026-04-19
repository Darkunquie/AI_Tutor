'use client';

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-[#D4A373]/15 text-[#f2be8c] border border-[#D4A373]/20',
  APPROVED: 'bg-[#b4e3b2]/10 text-[#b4e3b2] border border-[#b4e3b2]/20',
  REJECTED: 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${
        statusStyles[status] || 'bg-[#353437] text-[#9A948A] border border-[#50453B]/30'
      }`}
    >
      {status}
    </span>
  );
}