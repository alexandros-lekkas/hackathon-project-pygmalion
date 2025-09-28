import { ShineBorder } from "@/components/ui/shine-border";

interface MemorySearchColumnProps {
  children: React.ReactNode;
  isSearching?: boolean;
}

export function MemorySearchColumn({ children, isSearching = false }: MemorySearchColumnProps) {
  return (
    <div className="col-span-1 border h-full rounded-lg bg-background p-5 flex flex-col overflow-hidden relative">
      {isSearching && (
        <ShineBorder
          className="absolute inset-0 rounded-lg"
          borderWidth={2}
          duration={2.5}
          shineColor={["#8b5cf6", "#ec4899", "#f43f5e"]} // Purple to pink to red
        />
      )}
      {children}
    </div>
  );
}
