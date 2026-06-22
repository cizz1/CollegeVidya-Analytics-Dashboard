import React from "react";

export default function DataSource({ sheetUrl }: { sheetUrl: string }) {
  return (
    <div className="w-full h-full p-4 bg-background">
      <div className="bg-card-bg border border-card-border rounded-lg p-5 max-w-3xl">
        <div className="text-sm font-semibold text-monade uppercase tracking-wider mb-4">Backend Source</div>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 border-b border-card-border pb-3">
            <span className="text-muted">Base URL</span>
            <span className="font-mono text-foreground text-right break-all">{sheetUrl}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-card-border pb-3">
            <span className="text-muted">Analytics</span>
            <span className="font-mono text-foreground text-right break-all">/api/analytics/user/:user_uid</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Campaigns</span>
            <span className="font-mono text-foreground text-right break-all">/api/campaigns/user/:user_uid</span>
          </div>
        </div>
      </div>
    </div>
  );
}
