export function Column({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-1 border h-full rounded-lg bg-background p-5 flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
