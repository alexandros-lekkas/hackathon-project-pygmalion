import { Column } from "@/components/layout/column";

export default function Memory() {
  return (
    <Column>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-lg font-semibold">Memory</h2>
          <p className="text-sm text-muted-foreground">
            Manage your AI's memory
          </p>
        </div>
      </div>
    </Column>
  );
}
