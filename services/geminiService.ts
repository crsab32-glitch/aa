import { GoogleGenAI, Type } from "@google/genai";
import { Driver, Vehicle, Fine, DetranCode } from "../types";
import * as XLSX from "xlsx";

// Initialize Gemini com o modelo correto conforme as diretrizes
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
      let prompt = `Analise este documento (CNH Brasileira) e extraia os dados. 
      Retorne OBRIGATORIAMENTE um ARRAY JSON de objetos com:
      - 'name': Nome completo do condutor
      - 'cpf': Apenas os números do CPF
      - 'cnhNumber': Número de Registro da CNH
      - 'validityDate': Data de validade no formato YYYY-MM-DD
      Mesmo que seja PDF ou foto, faça o OCR completo.`;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Dados de Excel:\n${textData}` };
      } else {
        contentPart = await fileToPart(file);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
                },
                required: ["name", "cpf"]
            }
          }
        }
      });
      
      if (response.text) {
        try {
          const data = JSON.parse(response.text);
          if (Array.isArray(data)) results.push(...data);
        } catch (e) {
          console.error("Erro no parse do JSON da CNH", e);
        }
      }
    } catch (error) {
      console.error("Erro na API do Gemini para CNH", error);
    }
  }
  return results;
};

export const extractVehiclesFromFiles = async (files: File[]): Promise<Partial<Vehicle>[]> => {
  const results: Partial<Vehicle>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
      let prompt = `Analise este CRLV (Documento de Veículo) Digital ou físico. 
      Extraia os campos e retorne um ARRAY JSON:
      - 'plate': Placa do veículo (ex: ABC1234 ou ABC1D23)
      - 'renavam': Número do RENAVAM (apenas dígitos)
      - 'chassis': Número do Chassi
      - 'brand': Marca do fabricante
      - 'model': Nome do modelo
      - 'year': Ano de Fabricação ou Modelo (numérico)
      
      IMPORTANTE: Se o documento for PDF, verifique todas as páginas. A Placa e o Renavam são fundamentais.`;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Dados:\n${textData}` };
      } else {
        contentPart = await fileToPart(file);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
                },
                required: ["plate", "renavam"]
            }
          }
        }
      });
      
      if (response.text) {
        try {
          const data = JSON.parse(response.text);
          if (Array.isArray(data)) {
              const processed = data.map(v => ({
                  ...v,
                  year: v.year ? parseInt(String(v.year).replace(/\D/g, '').substring(0, 4)) : new Date().getFullYear()
              }));
              results.push(...processed);
          }
        } catch (e) {
          console.error("Erro no parse do JSON do Veículo", e);
        }
      }
    } catch (error) {
      console.error("Erro na API do Gemini para Veículo", error);
    }
  }
  return results;
};

export const extractFinesFromFiles = async (files: File[]): Promise<Partial<Fine>[]> => {
  const results: Partial<Fine>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
      let prompt = "Analise este documento de Multa/Auto de Infração e extraia todos os dados disponíveis em um ARRAY JSON.";
      let originalFileData: string | undefined;
      let originalMimeType: string | undefined;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Dados:\n${textData}` };
      } else {
        const part = await fileToPart(file);
        contentPart = part;
        originalFileData = part.inlineData.data;
        originalMimeType = part.inlineData.mimeType;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
                },
                required: ["autoInfraction", "plate"]
            }
          }
        }
      });
      
      if (response.text) {
        try {
          const data = JSON.parse(response.text);
          if (Array.isArray(data)) {
              const mapped = data.map(item => ({
                  ...item,
                  fileData: originalFileData,
                  fileMimeType: originalMimeType
              }));
              results.push(...mapped);
          }
        } catch (e) {
          console.error("Erro no parse do JSON da Multa", e);
        }
      }
    } catch (error) {
      console.error("Erro na API do Gemini para Multas", error);
    }
  }
  return results;
};

export const extractDetranCodesFromExcel = async (files: File[]): Promise<Partial<DetranCode>[]> => {
    const results: Partial<DetranCode>[] = [];
  
    for (const file of files) {
      try {
        let contentPart: any;
        let prompt = "Extraia códigos de infração do Detran para um ARRAY JSON.";

        if (isExcel(file)) {
           const textData = await excelToText(file);
           contentPart = { text: `Dados:\n${textData}` };
        } else {
           contentPart = await fileToPart(file);
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
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
          try {
            const data = JSON.parse(response.text);
            if (Array.isArray(data)) results.push(...data);
          } catch (e) {
            console.error("Erro no parse do JSON Detran", e);
          }
        }
      } catch (error) {
        console.error("Erro na API do Gemini para Detran", error);
      }
    }
    return results;
  };