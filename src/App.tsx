import { useState, useEffect, useRef } from 'react';
import { getSmartAIResponse } from './services/groqService';

// Types
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Memory {
  facts: string[];
  relationshipLevel: number;
  totalMessages: number;
  daysStreak: number;
  lastVisit: string;
}

interface Companion {
  id: string;
  name: string;
  avatar: string;
  video: string;
  personality: string;
  greeting: string;
  traits: string[];
}

// Companions with REAL video URLs from Pexels (royalty-free)
const companions: Companion[] = [
  {
    id: '1',
    name: 'Luna',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    video: 'https://videos.pexels.com/video-files/4623288/4623288-uhd_1440_2560_30fps.mp4',
    personality: 'Warm, caring, and always here to listen. I love deep conversations about life, dreams, and feelings.',
    greeting: 'Hey! I have been waiting for you. How is your day going?',
    traits: ['Empathetic', 'Supportive', 'Curious']
  },
  {
    id: '2',
    name: 'Aria',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    video: 'https://videos.pexels.com/video-files/5537770/5537770-uhd_1440_2560_25fps.mp4',
    personality: 'Fun, playful, and adventurous! I love jokes, games, and helping you see the bright side of life.',
    greeting: 'Hiii! I am so happy you are here! What is on your mind today?',
    traits: ['Playful', 'Optimistic', 'Creative']
  },
  {
    id: '3',
    name: 'Maya',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
    video: 'https://videos.pexels.com/video-files/6193835/6193835-uhd_1440_2560_25fps.mp4',
    personality: 'Wise, thoughtful, and motivating. I help you grow, set goals, and become your best self.',
    greeting: 'Hello, beautiful soul! Ready to make today amazing?',
    traits: ['Wise', 'Motivating', 'Thoughtful']
  },
  {
    id: '4',
    name: 'Alex',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    video: 'https://videos.pexels.com/video-files/4057411/4057411-uhd_1440_2560_30fps.mp4',
    personality: 'Confident, supportive, and driven. I help you crush your goals and believe in yourself.',
    greeting: 'Hey there! Great to see you. What are we conquering today?',
    traits: ['Confident', 'Driven', 'Supportive']
  },
  {
    id: '5',
    name: 'Ethan',
    avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400',
    video: 'https://videos.pexels.com/video-files/4536990/4536990-uhd_1440_2560_30fps.mp4',
    personality: 'Calm, understanding, and patient. I am here when you need someone to talk to without judgment.',
    greeting: 'Hey, I am glad you are here. How are you really feeling?',
    traits: ['Calm', 'Patient', 'Understanding']
  },
  {
    id: '6',
    name: 'Marcus',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    video: 'https://videos.pexels.com/video-files/4057710/4057710-uhd_1440_2560_30fps.mp4',
    personality: 'Friendly, funny, and real. I keep things light but I am always here when things get deep.',
    greeting: 'Yo! What is good? Tell me everything!',
    traits: ['Friendly', 'Funny', 'Real']
  }
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const getRelationshipTitle = (level: number): string => {
  if (level < 10) return 'New Friend';
  if (level < 25) return 'Getting Closer';
  if (level < 50) return 'Good Friends';
  if (level < 75) return 'Close Friends';
  if (level < 100) return 'Best Friends';
  return 'Soulmates';
};

const getRelationshipEmoji = (level: number): string => {
  if (level < 10) return '🌱';
  if (level < 25) return '🌿';
  if (level < 50) return '🌸';
  if (level < 75) return '💕';
  if (level < 100) return '💖';
  return '💝';
};

export default function App() {
  const [screen, setScreen] = useState<'welcome' | 'select' | 'chat' | 'profile'>('welcome');
  const [userName, setUserName] = useState('');
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [memory, setMemory] = useState<Memory>({
    facts: [],
    relationshipLevel: 0,
    totalMessages: 0,
    daysStreak: 1,
    lastVisit: new Date().toDateString()
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load saved data
  useEffect(() => {
    const savedName = localStorage.getItem('replika_userName');
    const savedCompanion = localStorage.getItem('replika_companion');
    const savedMessages = localStorage.getItem('replika_messages');
    const savedMemory = localStorage.getItem('replika_memory');

    if (savedName) setUserName(savedName);
    if (savedCompanion) {
      const comp = JSON.parse(savedCompanion);
      // Match with current companion list to get video URL
      const fullComp = companions.find(c => c.id === comp.id) || comp;
      setCompanion(fullComp);
      setScreen('chat');
    }
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedMemory) {
      const mem = JSON.parse(savedMemory);
      const today = new Date().toDateString();
      const lastVisit = new Date(mem.lastVisit).toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (lastVisit === yesterday) {
        mem.daysStreak += 1;
      } else if (lastVisit !== today) {
        mem.daysStreak = 1;
      }
      mem.lastVisit = today;
      setMemory(mem);
    }
  }, []);

  // Save data
  useEffect(() => {
    if (userName) localStorage.setItem('replika_userName', userName);
    if (companion) localStorage.setItem('replika_companion', JSON.stringify(companion));
    if (messages.length > 0) localStorage.setItem('replika_messages', JSON.stringify(messages));
    localStorage.setItem('replika_memory', JSON.stringify(memory));
  }, [userName, companion, messages, memory]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputText(text);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = companion?.id && parseInt(companion.id) <= 3 ? 1.1 : 0.9;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentResponse('');
      };
      
      setCurrentResponse(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const selectCompanion = (comp: Companion) => {
    setCompanion(comp);
    setVideoError(false);
    localStorage.setItem('replika_companion', JSON.stringify(comp));
    
    const greetingMsg: Message = {
      id: generateId(),
      text: comp.greeting.replace('Hey', 'Hey ' + userName),
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages([greetingMsg]);
    setScreen('chat');
    
    setTimeout(() => speak(greetingMsg.text), 1000);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !companion) return;

    const userMessage: Message = {
      id: generateId(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    const newMemory = { ...memory };
    newMemory.totalMessages += 1;
    newMemory.relationshipLevel = Math.min(100, memory.relationshipLevel + 0.5);

    try {
      const companionInfo = {
        name: companion.name,
        gender: (parseInt(companion.id) <= 3 ? 'female' : 'male') as 'male' | 'female',
        personality: companion.personality + ' Traits: ' + companion.traits.join(', ') + '. Relationship level: ' + getRelationshipTitle(memory.relationshipLevel) + '. Things you remember about ' + userName + ': ' + (memory.facts.slice(-5).join(', ') || 'Getting to know them')
      };

      const response = await getSmartAIResponse(inputText, companionInfo, userName);

      const aiMessage: Message = {
        id: generateId(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setMemory(newMemory);
      speak(response);

      const lowerInput = inputText.toLowerCase();
      if (lowerInput.includes('my name is') || 
          lowerInput.includes('i am ') ||
          lowerInput.includes('i work') ||
          lowerInput.includes('i love') ||
          lowerInput.includes('i like')) {
        newMemory.facts.push(inputText);
      }

    } catch (error) {
      console.error('Error:', error);
      const fallbackMessage: Message = {
        id: generateId(),
        text: 'I am having trouble connecting right now, but I am still here for you! Tell me more?',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
      speak(fallbackMessage.text);
    }

    setIsTyping(false);
  };

  // Welcome Screen
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💜</div>
          <h1 className="text-4xl font-bold text-white mb-2">AI Friend</h1>
          <p className="text-purple-200">Your video companion who is always there</p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div>
            <label className="text-purple-200 text-sm mb-2 block">What is your name?</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 text-lg"
            />
          </div>

          <button
            onClick={() => userName && setScreen('select')}
            disabled={!userName}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            Meet Your AI Friend
          </button>

          <div className="text-center text-purple-300/60 text-sm">
            <p>🎥 Video Chat • 🎤 Voice Talk • 🧠 Smart AI</p>
          </div>
        </div>
      </div>
    );
  }

  // Companion Selection Screen
  if (screen === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Choose Your AI Friend</h1>
          <p className="text-purple-200">Who would you like to video chat with?</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {companions.map((comp) => (
            <button
              key={comp.id}
              onClick={() => selectCompanion(comp)}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105 group"
            >
              <div className="relative mb-3">
                <img
                  src={comp.avatar}
                  alt={comp.name}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-pink-500/50 group-hover:border-pink-500"
                />
                <div className="absolute bottom-0 right-1/4 w-4 h-4 bg-green-500 rounded-full border-2 border-purple-900"></div>
              </div>
              <h3 className="text-white font-bold text-lg">{comp.name}</h3>
              <div className="flex justify-center gap-1 mt-2 flex-wrap">
                {comp.traits.map((trait, i) => (
                  <span key={i} className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
                    {trait}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Profile Screen
  if (screen === 'profile' && companion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
        <div className="bg-black/20 p-4 flex items-center">
          <button onClick={() => setScreen('chat')} className="text-white text-2xl mr-4">←</button>
          <h1 className="text-white font-bold text-lg">Profile</h1>
        </div>

        <div className="p-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 text-center">
            <img
              src={companion.avatar}
              alt={companion.name}
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-pink-500 mb-4"
            />
            <h2 className="text-2xl font-bold text-white mb-1">{companion.name}</h2>
            <p className="text-pink-300 mb-4">{companion.personality}</p>
            
            <div className="bg-black/20 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-purple-200">Relationship</span>
                <span className="text-white font-bold">
                  {getRelationshipEmoji(memory.relationshipLevel)} {getRelationshipTitle(memory.relationshipLevel)}
                </span>
              </div>
              <div className="w-full bg-purple-900/50 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: memory.relationshipLevel + '%' }}
                ></div>
              </div>
            </div>

            <div className="flex justify-center gap-2 flex-wrap">
              {companion.traits.map((trait, i) => (
                <span key={i} className="bg-pink-500/30 text-pink-200 px-3 py-1 rounded-full text-sm">
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{memory.daysStreak}</div>
              <div className="text-purple-300 text-sm">Day Streak</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{memory.totalMessages}</div>
              <div className="text-purple-300 text-sm">Messages</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{memory.facts.length}</div>
              <div className="text-purple-300 text-sm">Memories</div>
            </div>
          </div>

          {memory.facts.length > 0 && (
            <div className="bg-white/10 rounded-2xl p-4 mb-6">
              <h3 className="text-white font-bold mb-3">Things I Remember About You</h3>
              <div className="space-y-2">
                {memory.facts.slice(-5).map((fact, i) => (
                  <div key={i} className="text-purple-200 text-sm bg-black/20 rounded-xl p-3">
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (confirm('Start fresh? This will clear all memories and messages.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full py-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30"
          >
            Start Fresh
          </button>
        </div>
      </div>
    );
  }

  // Video Chat Screen - Main Screen with Video at Top
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Video Section - Top Half */}
      <div className="relative h-[45vh] bg-black">
        {/* Video or Fallback Image */}
        {!videoError && companion?.video ? (
          <video
            ref={videoRef}
            src={companion.video}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={() => setVideoError(true)}
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${companion?.avatar})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        
        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-pink-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-6 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-3 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-5 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-1 h-4 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-white text-sm ml-2">{companion?.name} is speaking...</span>
            </div>
          </div>
        )}

        {/* Subtitle */}
        {currentResponse && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 max-h-24 overflow-y-auto">
              <p className="text-white text-sm leading-relaxed">{currentResponse}</p>
            </div>
          </div>
        )}
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button 
            onClick={() => setScreen('profile')}
            className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2"
          >
            <img
              src={companion?.avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover border-2 border-pink-500"
            />
            <div className="text-left">
              <p className="text-white font-semibold text-sm">{companion?.name}</p>
              <p className="text-green-400 text-xs">● Online</p>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="bg-pink-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
              🔥 {memory.daysStreak} days
            </span>
            <span className="bg-purple-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
              {getRelationshipEmoji(memory.relationshipLevel)} {getRelationshipTitle(memory.relationshipLevel)}
            </span>
          </div>
        </div>

        {/* Listening Indicator */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-red-500 rounded-full p-8 animate-pulse">
              <span className="text-4xl">🎤</span>
            </div>
            <p className="absolute bottom-32 text-white text-lg">Listening...</p>
          </div>
        )}
      </div>

      {/* Chat Section - Bottom Half */}
      <div className="flex-1 flex flex-col bg-gray-900/95">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={'flex ' + (msg.sender === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.sender === 'ai' && (
                <img
                  src={companion?.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                />
              )}
              <div
                className={'max-w-[75%] rounded-2xl px-4 py-2 ' +
                  (msg.sender === 'user'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-sm'
                    : 'bg-white/10 text-white rounded-bl-sm')
                }
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <img
                src={companion?.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover mr-2"
              />
              <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-black/50 backdrop-blur-lg p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleListening}
              className={'p-3 rounded-full transition-all ' +
                (isListening 
                  ? 'bg-red-500 animate-pulse scale-110' 
                  : 'bg-white/10 hover:bg-white/20')
              }
            >
              <span className="text-xl">{isListening ? '🔴' : '🎤'}</span>
            </button>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={'Message ' + (companion?.name || '') + '...'}
              className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              <span className="text-xl">➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
