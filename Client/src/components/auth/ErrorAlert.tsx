import React from 'react';

const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="w-full bg-red-600/90 text-white rounded-lg px-4 py-2 mb-4 shadow animate-fade-in">
    <span className="font-semibold">Error:</span> {message}
  </div>
);

export default ErrorAlert; 