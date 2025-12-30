import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { Fine, Driver } from '../types';
import { getDrivers } from '../services/storageService';

interface ReceiptModalProps {
  fine: Fine;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ fine, onClose }) => {
  const drivers = getDrivers();
  const driver = drivers.find(d => d.name === fine.driverName);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4 no-print">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="text-blue-600" /> Recibo de Ciência de Multa
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-md"
            >
              <Printer size={18} /> Imprimir
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-12 overflow-y-auto bg-white text-slate-900" id="receipt-content">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; }
              #receipt-content { padding: 0 !important; width: 100%; }
            }
          `}} />
          
          <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-black uppercase">Termo de Ciência e Notificação de Infração</h1>
            <p className="text-sm font-medium mt-1">SISTEMA DE CONTROLE E GESTÃO DE MULTAS</p>
          </div>

          <div className="space-y-6 text-justify leading-relaxed">
            <p>
              Eu, <strong>{fine.driverName || '________________________________'}</strong>, 
              inscrito no CPF sob o nº <strong>{driver?.cpf || '__________________'}</strong>, portador da CNH nº <strong>{driver?.cnhNumber || '__________'}</strong>, 
              declaro para os devidos fins de direito estar devidamente ciente da infração de trânsito abaixo discriminada, ocorrida com o veículo de placa <strong>{fine.plate}</strong>.
            </p>

            <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200 space-y-2">
              <p><strong>Auto de Infração:</strong> {fine.autoInfraction}</p>
              <p><strong>Data da Ocorrência:</strong> {formatDate(fine.date)}</p>
              <p><strong>Código/Descrição:</strong> {fine.code} - {fine.description}</p>
              <p><strong>Órgão Autuador:</strong> {fine.organ}</p>
              <p><strong>Local:</strong> {fine.location}</p>
              <p><strong>Valor da Infração:</strong> R$ {fine.value.toFixed(2)} {fine.payDouble ? '(VALOR DOBRADO)' : ''}</p>
              <p><strong>Pontuação:</strong> {fine.payDouble ? '0 (SEM PONTOS)' : `${fine.points} pontos`}</p>
            </div>

            <p>
              Autorizo, por meio deste termo, o desconto do valor acima mencionado em meu próximo holerite/pagamento, conforme acordado previamente nas normas de utilização de veículos da empresa, 
              bem como assumo a responsabilidade pela pontuação gerada em meu prontuário de condutor.
            </p>

            <div className="pt-16 grid grid-cols-1 gap-12">
              <div className="text-center">
                <p className="mb-2">_____________________________________________________</p>
                <p className="font-bold">ASSINATURA DO CONDUTOR</p>
                <p className="text-xs">{fine.driverName}</p>
              </div>

              <div className="flex justify-between items-end mt-8">
                <div>
                  <p>Data: ____/____/202__</p>
                </div>
                <div className="text-right">
                  <p>Responsável Frota: ________________________</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-[10px] text-slate-400 text-center border-t pt-4">
            Gerado eletronicamente em {new Date().toLocaleString('pt-BR')} - ID: {fine.id}
          </div>
        </div>
      </div>
    </div>
  );
};