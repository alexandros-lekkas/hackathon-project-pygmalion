import { ShineBorder } from "@/components/ui/shine-border";

interface ColumnProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function Column({ children, isLoading = false }: ColumnProps) {
  return (
    <div className="col-span-1 border h-full rounded-lg bg-background p-5 flex flex-col overflow-hidden relative">
      {isLoading && (
        <ShineBorder
          className="absolute inset-0 rounded-lg"
          borderWidth={2}
          duration={2}
          shineColor={["#3b82f6", "#8b5cf6", "#06b6d4"]}
        />
      )}
      {children}
    </div>
  );
}
