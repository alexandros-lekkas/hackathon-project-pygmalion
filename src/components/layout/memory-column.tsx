import { ShineBorder } from "@/components/ui/shine-border";

interface MemoryColumnProps {
  children: React.ReactNode;
  isProcessing?: boolean;
}

export function MemoryColumn({ children, isProcessing = false }: MemoryColumnProps) {
  return (
    <div className="col-span-1 border h-full rounded-lg bg-background p-5 flex flex-col overflow-hidden relative">
      {isProcessing && (
        <ShineBorder
          className="absolute inset-0 rounded-lg"
          borderWidth={2}
          duration={2.5}
          shineColor={["#8b5cf6", "#6366f1", "#06b6d4"]} // Purple to indigo to cyan
        />
      )}
      {children}
    </div>
  );
}
