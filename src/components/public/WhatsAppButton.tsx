import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WhatsAppButtonProps {
  phoneNumber?: string;
}

type ChatStep = 'greeting' | 'name' | 'interest' | 'budget' | 'contact' | 'finished';

interface ChatMessage {
  role: 'bot' | 'user';
  content: string;
}

export function WhatsAppButton({ 
  phoneNumber = '5512997655893'
}: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ChatStep>('greeting');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: 'Olá! 👋 Bem-vindo à Invest Veículos! Sou a assistente virtual e vou te ajudar a encontrar o carro ideal.' }
  ]);
  const [input, setInput] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    interest: '',
    budget: '',
    phone: ''
  });

  const botResponses: Record<ChatStep, string> = {
    greeting: 'Para começar, qual é o seu nome?',
    name: 'Prazer em conhecer você! Qual tipo de veículo você está procurando? (Ex: SUV, Sedan, Hatch, Picape...)',
    interest: 'Ótima escolha! Qual é o seu orçamento aproximado?',
    budget: 'Perfeito! Por último, me passa seu telefone para que um de nossos consultores entre em contato com as melhores opções.',
    contact: 'Maravilha! 🎉 Recebemos suas informações. Em breve um consultor entrará em contato pelo WhatsApp. Obrigado pela preferência!',
    finished: ''
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    // Process based on current step
    let nextStep: ChatStep = step;
    
    switch (step) {
      case 'greeting':
        setUserData(prev => ({ ...prev, name: userMessage }));
        nextStep = 'name';
        break;
      case 'name':
        setUserData(prev => ({ ...prev, interest: userMessage }));
        nextStep = 'interest';
        break;
      case 'interest':
        setUserData(prev => ({ ...prev, budget: userMessage }));
        nextStep = 'budget';
        break;
      case 'budget':
        setUserData(prev => ({ ...prev, phone: userMessage }));
        nextStep = 'contact';
        break;
      case 'contact':
        nextStep = 'finished';
        break;
    }

    // Add bot response after a small delay
    setTimeout(() => {
      if (botResponses[nextStep]) {
        setMessages(prev => [...prev, { role: 'bot', content: botResponses[nextStep] }]);
      }
      setStep(nextStep);

      // If finished, redirect to WhatsApp after 2 seconds
      if (nextStep === 'contact') {
        setTimeout(() => {
          const message = `Olá! Me chamo ${userData.name}. Tenho interesse em ${userData.interest}, com orçamento de ${userData.budget}. Meu telefone: ${userMessage}`;
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
        }, 2000);
      }
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const resetChat = () => {
    setStep('greeting');
    setMessages([
      { role: 'bot', content: 'Olá! 👋 Bem-vindo à Invest Veículos! Sou a assistente virtual e vou te ajudar a encontrar o carro ideal.' },
      { role: 'bot', content: 'Para começar, qual é o seu nome?' }
    ]);
    setUserData({ name: '', interest: '', budget: '', phone: '' });
  };

  return (
    <>
      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="bg-[#25D366] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Invest Veículos</h3>
                  <p className="text-xs text-white/80">Online agora</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[300px] overflow-y-auto p-4 space-y-3 bg-muted/30">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div 
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#25D366] text-white rounded-br-md' 
                        : 'bg-background border border-border rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            {step !== 'finished' && (
              <div className="p-3 border-t border-border bg-background flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 text-sm"
                />
                <Button 
                  onClick={handleSend}
                  size="icon"
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Restart button when finished */}
            {step === 'finished' && (
              <div className="p-3 border-t border-border bg-background">
                <Button 
                  onClick={resetChat}
                  variant="outline"
                  className="w-full"
                >
                  Iniciar nova conversa
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => {
          if (!isOpen) {
            resetChat();
          }
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
        <span className="sr-only">Fale conosco</span>
      </motion.button>
    </>
  );
}