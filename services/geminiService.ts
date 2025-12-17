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
    reader.onload = (e) => {
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
    reader.onerror = reject;
    reader.readAsBinaryString(file);
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
        model: 'gemini-2.5-flash',
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
      let prompt = "Extract vehicle document (CRLV) data. Return JSON list with keys: plate, renavam, chassis, brand, model, year.";

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Data from Excel/CSV:\n${textData}` };
        prompt += " The input is structured text data.";
      } else {
        contentPart = await fileToPart(file);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
                    year: { type: Type.INTEGER }
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

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Data from Excel/CSV:\n${textData}` };
        prompt += " The input is structured text data.";
      } else {
        contentPart = await fileToPart(file);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
        if (Array.isArray(data)) results.push(...data);
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
          model: 'gemini-2.5-flash',
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