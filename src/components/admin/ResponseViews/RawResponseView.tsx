import React from 'react';

interface RawResponseViewProps {
  content: string;
}

export function RawResponseView({ content }: RawResponseViewProps) {
  return (
    <div className="overflow-y-auto p-4">
      <div className="sticky top-0 bg-white pb-2 mb-2 border-b z-10">
        <div className="text-sm font-medium text-gray-500">Raw Response</div>
      </div>
      <pre className="whitespace-pre-wrap break-words">
        {content || '// Waiting for response...'}
      </pre>
    </div>
  );
}