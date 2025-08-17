import React from "react";

interface LivePreviewProps {
  html: string; // full bundle (<!DOCTYPE html> ... </html>)
}

const LivePreview: React.FC<LivePreviewProps> = ({ html }) => {
  return (
    <div className="relative w-full h-screen bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      <span className="absolute top-3 right-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow">
        Live
      </span>
      <iframe
        srcDoc={html}
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin allow-modals"
        frameBorder="0"
        className="w-full h-full bg-white rounded-xl border-0"
      />
    </div>
  );
};

export default LivePreview;
