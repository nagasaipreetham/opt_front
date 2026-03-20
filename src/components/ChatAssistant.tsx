import { useState, useRef, useEffect } from 'react';
import { Eye, X, Send, Image as ImageIcon, Clipboard } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && !imagePreview) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      image: imagePreview || undefined
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;
      
      if (imagePreview) {
        const formData = new FormData();
        const blob = await fetch(imagePreview).then(r => r.blob());
        formData.append('image', blob, 'eye-image.jpg');
        
        response = await axios.post('/api/analyze-eye', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setImagePreview(null);
        setMessages(prev => []);
      } else {
        response = await axios.post('/api/chat', {
          message: input,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        });
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error.response?.data?.message || 'Sorry, something went wrong.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      alert('No image found in clipboard');
    } catch (error) {
      console.error('Error pasting image:', error);
      alert('Failed to paste image from clipboard');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-50"
        >
          <Eye size={28} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          <div className="bg-primary text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Eye size={24} />
              <h3 className="font-semibold">Eye Care Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-4">
                <Eye size={48} className="mx-auto mb-4 text-primary" />
                <p className="font-semibold mb-2">Eye Care & Optometry Assistant</p>
                <p className="text-sm mb-4">Ask me about:</p>
                <div className="text-left text-xs space-y-1 bg-blue-50 p-3 rounded-lg">
                  <p>• Eye health & conditions</p>
                  <p>• Lens power calculations</p>
                  <p>• Vertex distance compensation</p>
                  <p>• Prentice's rule (prism)</p>
                  <p>• IOL power (SRK formula)</p>
                  <p>• Near addition & intermediate Rx</p>
                  <p>• Vertical imbalance</p>
                  <p>• And more optometry formulas!</p>
                </div>
                <p className="text-xs mt-3 text-gray-400">
                  Example: "Calculate lens power for 0.5m focal length"
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.image && (
                    <img src={msg.image} alt="Uploaded" className="mb-2 rounded max-w-full" />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {imagePreview && (
            <div className="p-2 border-t relative">
              <img src={imagePreview} alt="Preview" className="max-h-32 rounded" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-3 right-3 bg-red-500 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="p-4 border-t">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                title="Upload image"
              >
                <ImageIcon size={20} />
              </button>
              <button
                onClick={handlePaste}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                title="Paste from clipboard"
              >
                <Clipboard size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about eye health or calculations..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || (!input.trim() && !imagePreview)}
                className="bg-primary text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Medical disclaimer: For educational purposes only. Consult a professional.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
