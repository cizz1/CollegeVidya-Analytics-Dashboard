import React from "react";

export default function DataSource({ sheetUrl }: { sheetUrl: string }) {
  // Convert the sheet URL to the embeddable format
  const embedUrl = sheetUrl.replace("/edit?usp=sharing", "/htmlview?widget=true&headers=false");

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