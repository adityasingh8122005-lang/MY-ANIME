import { useLoginModal } from '../contexts/LoginModalContext';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus } from 'lucide-react';
import { Button } from './ui/Button';

export default function LoginModal() {
  const { isOpen, closeLoginModal } = useLoginModal();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-elevated border border-zinc-700 rounded-lg max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 relative">
        <button 
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/30">
            <LogIn size={24} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-sm text-zinc-400">
            Sign in or create an account to add anime to your personal collection.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => { closeLoginModal(); navigate('/auth'); }} variant="primary" className="w-full" icon={LogIn}>Log In</Button>
          
          <Button onClick={() => { closeLoginModal(); navigate('/auth?signup=true'); }} variant="secondary" className="w-full" icon={UserPlus}>Sign Up</Button>
        </div>
      </div>
    </div>
  );
}
