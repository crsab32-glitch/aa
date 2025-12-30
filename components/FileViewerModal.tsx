import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface FileViewerModalProps {
  fileData: string;
  mimeType: string;
  title: string;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ fileData, mimeType, title, onClose }) => {
  const dataUrl = `data:${mimeType};base64,${fileData}`;
  const isPdf = mimeType.includes('pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Documento_Multa_${title.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'jpg'}`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
             <h3 className="font-bold text-lg truncate max-w-md">Documento Original: {title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={handleDownload}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition flex items-center gap-2 text-sm"
                title="Download"
            >
                <Download size={18} /> Baixar
            </button>
            <button 
                onClick={() => window.open(dataUrl, '_blank')}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition flex items-center gap-2 text-sm"
                title="Abrir em Nova Aba"
            >
                <ExternalLink size={18} /> Abrir Externo
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2"></div>
            <button onClick={onClose} className="p-2 hover:bg-red-600 rounded-lg transition" title="Fechar">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 overflow-hidden">
          {isPdf ? (
            <iframe 
              src={dataUrl} 
              className="w-full h-full rounded shadow-inner" 
              title="PDF Viewer"
            />
          ) : (
            <div className="w-full h-full overflow-auto flex items-center justify-center bg-slate-200 rounded">
                <img 
                  src={dataUrl} 
                  alt="Original fine document" 
                  className="max-w-full max-h-full object-contain shadow-lg"
                />
            </div>
          )}
        </div>
        
        <div className="p-3 bg-slate-50 border-t text-center text-[10px] text-slate-400">
            A visualização depende da compatibilidade do seu navegador com arquivos {isPdf ? 'PDF' : 'de imagem'}.
        </div>
      </div>
    </div>
  );
};