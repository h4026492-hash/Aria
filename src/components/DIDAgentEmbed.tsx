import React, { useState } from 'react';

interface DIDAgentEmbedProps {
  agentId: string;
  agentKey: string;
}

const DIDAgentEmbed: React.FC<DIDAgentEmbedProps> = ({ agentId, agentKey }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Construct the embed URL with the agent ID and key
  const embedUrl = `https://studio.d-id.com/agents/share?id=${agentId}&key=${agentKey}`;

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-black z-10">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading your AI companion...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
        </div>
      )}
      
      {/* D-ID Agent Iframe */}
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        allow="camera; microphone; autoplay; encrypted-media"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        title="AI Companion"
      />
    </div>
  );
};

export default DIDAgentEmbed;
