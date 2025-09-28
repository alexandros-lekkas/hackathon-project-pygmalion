export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen bg-sidebar grid grid-cols-3 gap-5 p-5">
      {children}
    </div>
  );
}
