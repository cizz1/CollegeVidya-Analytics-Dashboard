import React from "react";

export default function DataSource({ sheetUrl }: { sheetUrl: string }) {
  // Use the direct URL to allow normal Google Sheets interaction
  const embedUrl = sheetUrl;

  return (
    <div className="w-full h-full p-4">
      <iframe
        src={embedUrl}
        className="w-full h-full rounded-lg border border-card-border bg-white"
        title="Google Sheet Data Source"
      />
    </div>
  );
}