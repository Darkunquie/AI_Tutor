import { cn } from "@/lib/cn";

interface ModuleRackProps {
  unit: string;
  name: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export function ModuleRack({ unit, name, children, className, headerRight }: ModuleRackProps) {
  return (
    <section className={cn("px-8 md:px-12", className)}>
      <div className="flex items-center justify-between mb-0">
        <div className="module-header">UNIT: {unit} // {name}</div>
        {headerRight ? <div className="font-jetbrains-mono text-[10px] text-[#4FD1FF]/40 tracking-widest">{headerRight}</div> : null}
      </div>
      {children}
    </section>
  );
}
