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
      let prompt = "Extract driver license (CNH) data. Return JSON list with keys: name, cpf, cnhNumber, validityDate (YYYY-MM-DD format).";

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Data from Excel/CSV:\n${textData}` };
        prompt += " The input is structured text data.";
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
      console.error("Error extracting driver data", error);
    }
  }
  return results;
};

export const extractVehiclesFromFiles = async (files: File[]): Promise<Partial<Vehicle>[]> => {
  const results: Partial<Vehicle>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
      
      // Prompt extremamente detalhado para CRLV Digital Brasileiro
      let prompt = `Extract data from the Brazilian Vehicle Document (CRLV). 
      Look for:
      - 'plate' (Placa do veículo, e.g., ABC1D23)
      - 'renavam' (Código RENAVAM, usually 11 digits)
      - 'chassis' (Número do CHASSI, usually 17 characters)
      - 'brand' (Marca do fabricante, e.g., FIAT, VW, FORD)
      - 'model' (Modelo do veículo, e.g., GOL, UNO, ONIX)
      - 'year' (Ano do Modelo / Ano Fabricação, e.g., 2020)
      
      IMPORTANT: Brand and Model are often joined as 'MARCA/MODELO' (e.g., 'VW/GOL'). Separate them.
      If year is found as '2019/2020', use the second part (2020).
      Return a JSON ARRAY.`;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Data from Excel/CSV:\n${textData}` };
        prompt += " The input is structured text data.";
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
                    year: { type: Type.STRING } // Use STRING to handle "2019/2020" and parse later
                },
                required: ["plate", "renavam"]
            }
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        if (Array.isArray(data)) {
            const processed = data.map(v => ({
                ...v,
                // Garantir que o ano seja um número
                year: v.year ? parseInt(v.year.split('/')[v.year.split('/').length - 1]) : new Date().getFullYear()
            }));
            results.push(...processed);
        }
      }
    } catch (error) {
      console.error("Error extracting vehicle data", error);
    }
  }
  return results;
};

export const extractFinesFromFiles = async (files: File[]): Promise<Partial<Fine>[]> => {
  const results: Partial<Fine>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
      let prompt = "Extract traffic fine (multa) data. Return JSON list. Map 'autoInfraction' to the fine number/code. 'indicatesDriver' should be boolean.";
      let originalFileData: string | undefined;
      let originalMimeType: string | undefined;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Data from Excel/CSV:\n${textData}` };
        prompt += " The input is structured text data.";
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
      console.error("Error extracting fine data", error);
    }
  }
  return results;
};

export const extractDetranCodesFromExcel = async (files: File[]): Promise<Partial<DetranCode>[]> => {
    const results: Partial<DetranCode>[] = [];
  
    for (const file of files) {
      try {
        let contentPart: any;
        let prompt = "Extract Detran infraction codes, descriptions, values, and points from this list. Return JSON.";

        if (isExcel(file)) {
           const textData = await excelToText(file);
           contentPart = { text: `Data from Excel/CSV:\n${textData}` };
           prompt += " The input is structured text data. Columns might be named 'Código', 'Infração', 'Valor', 'Pontos'.";
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
          const data = JSON.parse(response.text);
          if (Array.isArray(data)) results.push(...data);
        }
      } catch (error) {
        console.error("Error extracting detran data", error);
      }
    }
    return results;
  };