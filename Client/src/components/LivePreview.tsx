import React, { useEffect, useState } from 'react';
import { debounce } from 'lodash';

interface LivePreviewProps {
  html: string;
  css: string;
  js: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({ html, css, js }) => {
  const [srcDoc, setSrcDoc] = useState('');

  const updateSrcDoc = React.useCallback(
    debounce((htmlContent: string, cssContent: string, jsContent: string) => {
      const source = `<!DOCTYPE html><html><head><style>${cssContent}</style></head><body>${htmlContent}<script>${jsContent}</script></body></html>`;
      setSrcDoc(source);
    }, 300),
    []
  );

  useEffect(() => {
    updateSrcDoc(html, css, js);
  }, [html, css, js, updateSrcDoc]);

  return (
    <div className="relative w-full h-screen bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      <span className="absolute top-3 right-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow">Live</span>
      <iframe
        srcDoc={srcDoc}
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin"
        frameBorder="0"
        className="w-full h-full bg-gray-900 rounded-xl border-0"
      />
    </div>
  );
};

export default LivePreview;