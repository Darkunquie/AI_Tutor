export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8] dark:bg-[#101722]">
      <div className="text-center">
        <div className="relative mx-auto w-12 h-12">
          <div className="w-12 h-12 border-4 border-[#3c83f6]/20 rounded-full" />
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#3c83f6] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
