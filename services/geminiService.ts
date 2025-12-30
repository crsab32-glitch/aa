import { GoogleGenAI, Type } from "@google/genai";
import { Driver, Vehicle, Fine, DetranCode } from "../types";
import * as XLSX from "xlsx";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const excelToText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const readerBinary = new FileReader();
    readerBinary.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        resolve(csv);
      } catch (err) {
        reject(err);
      }
    };
    readerBinary.onerror = reject;
    readerBinary.readAsBinaryString(file);
  });
};

const isExcel = (file: File) => 
  file.name.endsWith('.xls') || 
  file.name.endsWith('.xlsx') || 
  file.type.includes('sheet') || 
  file.type.includes('excel');

export const extractDriversFromFiles = async (files: File[]): Promise<Partial<Driver>[]> => {
  const results: Partial<Driver>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
      let prompt = `Extraia dados da CNH (Carteira Nacional de Habilitação) deste documento. 
      Retorne um JSON contendo uma lista de objetos com as chaves: 
      - 'name': Nome completo
      - 'cpf': CPF (apenas números)
      - 'cnhNumber': Número de Registro
      - 'validityDate': Data de Validade no formato YYYY-MM-DD
      Caso seja um PDF, leia todas as páginas.`;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Data from Excel/CSV:\n${textData}` };
      } else {
        contentPart = await fileToPart(file);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: {
            parts: [
                contentPart,
                { text: prompt }
            ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    cpf: { type: Type.STRING },
                    cnhNumber: { type: Type.STRING },
                    validityDate: { type: Type.STRING }
                }
            }
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        if (Array.isArray(data)) results.push(...data);
      }
    } catch (error) {
      console.error("Erro ao extrair motorista", error);
    }
  }
  return results;
};

export const extractVehiclesFromFiles = async (files: File[]): Promise<Partial<Vehicle>[]> => {
  const results: Partial<Vehicle>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
      let prompt = `Extraia dados do CRLV (Certificado de Registro e Licenciamento de Veículo) brasileiro. 
      Este documento pode ser uma foto ou um PDF (CRLV-e).
      Procure pelos campos:
      - 'plate': Placa (ex: ABC1234 ou ABC1D23)
      - 'renavam': Código RENAVAM (apenas números)
      - 'chassis': Chassi (17 caracteres)
      - 'brand': Marca
      - 'model': Modelo
      - 'year': Ano Modelo (use o ano mais recente se houver Fabricação/Modelo)
      
      Importante: Se o campo 'MARCA/MODELO' estiver junto, separe-os.
      Retorne um ARRAY JSON.`;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Dados de Excel:\n${textData}` };
      } else {
        contentPart = await fileToPart(file);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: {
            parts: [
                contentPart,
                { text: prompt }
            ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    plate: { type: Type.STRING },
                    renavam: { type: Type.STRING },
                    chassis: { type: Type.STRING },
                    brand: { type: Type.STRING },
                    model: { type: Type.STRING },
                    year: { type: Type.STRING }
                }
            }
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        if (Array.isArray(data)) {
            const processed = data.map(v => ({
                ...v,
                year: v.year ? parseInt(String(v.year).split('/')[String(v.year).split('/').length - 1]) : new Date().getFullYear()
            }));
            results.push(...processed);
        }
      }
    } catch (error) {
      console.error("Erro ao extrair veículo", error);
    }
  }
  return results;
};

export const extractFinesFromFiles = async (files: File[]): Promise<Partial<Fine>[]> => {
  const results: Partial<Fine>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
      let prompt = "Extraia os dados da Notificação de Autuação ou Imposição de Penalidade (Multa). Retorne JSON Array.";
      let originalFileData: string | undefined;
      let originalMimeType: string | undefined;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Dados Excel:\n${textData}` };
      } else {
        const part = await fileToPart(file);
        contentPart = part;
        originalFileData = part.inlineData.data;
        originalMimeType = part.inlineData.mimeType;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: {
            parts: [
                contentPart,
                { text: prompt }
            ]
        },
        config: {
          responseMimeType: "application/json",
           responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    driverName: { type: Type.STRING, nullable: true },
                    plate: { type: Type.STRING },
                    autoInfraction: { type: Type.STRING },
                    date: { type: Type.STRING },
                    code: { type: Type.STRING },
                    description: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    organ: { type: Type.STRING },
                    indicatesDriver: { type: Type.BOOLEAN },
                    location: { type: Type.STRING },
                    points: { type: Type.INTEGER },
                    observations: { type: Type.STRING, nullable: true },
                }
            }
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        if (Array.isArray(data)) {
            const mapped = data.map(item => ({
                ...item,
                fileData: originalFileData,
                fileMimeType: originalMimeType
            }));
            results.push(...mapped);
        }
      }
    } catch (error) {
      console.error("Erro ao extrair multas", error);
    }
  }
  return results;
};

export const extractDetranCodesFromExcel = async (files: File[]): Promise<Partial<DetranCode>[]> => {
    const results: Partial<DetranCode>[] = [];
  
    for (const file of files) {
      try {
        let contentPart: any;
        let prompt = "Extraia os códigos de infração do Detran. Retorne JSON.";

        if (isExcel(file)) {
           const textData = await excelToText(file);
           contentPart = { text: `Dados Excel:\n${textData}` };
        } else {
           contentPart = await fileToPart(file);
        }

        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: {
              parts: [
                  contentPart,
                  { text: prompt }
              ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        code: { type: Type.STRING },
                        description: { type: Type.STRING },
                        defaultValue: { type: Type.NUMBER },
                        defaultPoints: { type: Type.INTEGER }
                    }
                }
              }
          }
        });
        
        if (response.text) {
          const data = JSON.parse(response.text);
          if (Array.isArray(data)) results.push(...data);
        }
      } catch (error) {
        console.error("Erro ao extrair códigos Detran", error);
      }
    }
    return results;
  };