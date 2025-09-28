import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Umax Facial Analysis",
  description: "AI-powered facial analysis for looksmaxxing",
};

export default function UmaxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
