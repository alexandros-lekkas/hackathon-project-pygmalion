export function Column({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-1 border h-full rounded-lg bg-background flex flex-col gap-5 p-5">
      {children}
    </div>
  );
}
