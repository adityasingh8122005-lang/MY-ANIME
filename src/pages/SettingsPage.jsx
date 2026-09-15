import { useState, useRef } from 'react';
import { exportUserData, importUserData } from '../services/userService';
import { Download, Upload, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef(null);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleExport = async () => {
    try {
      const json = await exportUserData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-anime-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage("Backup exported successfully.");
    } catch (err) {
      console.error(err);
      showMessage("Failed to export backup.", true);
    }
  };

  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importUserData(parsed);
      showMessage("Backup imported successfully!");
    } catch (err) {
      console.error(err);
      showMessage("Invalid backup file.", true);
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-8">
        <SettingsIcon className="text-accent" /> Settings
      </h1>

      <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Data Management</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Your personal tracking data is stored locally on this device. Export a backup to keep it safe or move it to another device.
        </p>

        {message && (
          <div className={`p-3 mb-6 rounded-md text-sm flex items-center gap-2 ${isError ? 'bg-red-950/50 text-red-400 border border-red-900' : 'bg-green-950/50 text-green-400 border border-green-900'}`}>
            {isError && <AlertTriangle size={16} />}
            {message}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-dark-elevated hover:bg-zinc-700 text-white px-4 py-2 rounded-md border border-zinc-700 transition-colors text-sm font-medium"
          >
            <Download size={16} /> Export Backup
          </button>

          <button 
            onClick={handleImportClick}
            className="flex items-center gap-2 bg-dark-elevated hover:bg-zinc-700 text-white px-4 py-2 rounded-md border border-zinc-700 transition-colors text-sm font-medium"
          >
            <Upload size={16} /> Import Backup
          </button>
          
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>
      </div>

    </div>
  );
}

