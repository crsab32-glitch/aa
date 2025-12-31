import { GoogleGenAI, Type } from "@google/genai";
import { Driver, Vehicle, Fine, DetranCode } from "../types";
import * as XLSX from "xlsx";

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
      const prompt = `Você é um especialista em documentos brasileiros. Analise esta CNH (Carteira Nacional de Habilitação).
      Extraia os seguintes campos com precisão:
      - 'name': Nome completo do condutor.
      - 'cpf': O número do CPF (apenas os 11 dígitos numéricos).
      - 'cnhNumber': O Número de Registro (campo 'Nº REGISTRO').
      - 'validityDate': A Data de Validade no formato YYYY-MM-DD.
      
      Retorne obrigatoriamente um ARRAY JSON, mesmo que haja apenas um documento. Se não encontrar um campo, deixe-o nulo.`;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Dados Excel:\n${textData}` };
      } else {
        contentPart = await fileToPart(file);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [contentPart, { text: prompt }] },
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
        const data = JSON.parse(response.text);
        if (Array.isArray(data)) results.push(...data);
      }
    } catch (error) {
      console.error("Falha na extração de CNH:", error);
    }
  }
  return results;
};

export const extractVehiclesFromFiles = async (files: File[]): Promise<Partial<Vehicle>[]> => {
  const results: Partial<Vehicle>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
      const prompt = `Analise este documento CRLV (Certificado de Registro e Licenciamento de Veículo) Digital.
      Localize e extraia os campos:
      - 'plate': Placa do veículo (ex: ABC1234 ou ABC1D23).
      - 'renavam': Número do RENAVAM (apenas dígitos).
      - 'chassis': Número do Chassi (17 caracteres).
      - 'brand': Marca (ex: FIAT).
      - 'model': Modelo (ex: UNO).
      - 'year': Ano de Fabricação ou Modelo (numérico).
      
      Retorne um ARRAY JSON. Se o documento for um PDF com várias páginas, verifique todas.`;

      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Dados:\n${textData}` };
      } else {
        contentPart = await fileToPart(file);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [contentPart, { text: prompt }] },
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
        const data = JSON.parse(response.text);
        if (Array.isArray(data)) {
          const processed = data.map(v => ({
            ...v,
            year: v.year ? parseInt(String(v.year).replace(/\D/g, '').substring(0,4)) : new Date().getFullYear()
          }));
          results.push(...processed);
        }
      }
    } catch (error) {
      console.error("Falha na extração de CRLV:", error);
    }
  }
  return results;
};

export const extractFinesFromFiles = async (files: File[]): Promise<Partial<Fine>[]> => {
  const results: Partial<Fine>[] = [];

  for (const file of files) {
    try {
      let contentPart: any;
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
            { text: "Extraia todos os dados desta Notificação de Autuação de Trânsito para um ARRAY JSON." }
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
        const data = JSON.parse(response.text);
        if (Array.isArray(data)) {
          results.push(...data.map(item => ({
            ...item,
            fileData: originalFileData,
            fileMimeType: originalMimeType
          })));
        }
      }
    } catch (error) {
      console.error("Falha na extração de Multa:", error);
    }
  }
  return results;
};

export const extractDetranCodesFromExcel = async (files: File[]): Promise<Partial<DetranCode>[]> => {
  const results: Partial<DetranCode>[] = [];
  for (const file of files) {
    try {
      let contentPart: any;
      if (isExcel(file)) {
        const textData = await excelToText(file);
        contentPart = { text: `Dados:\n${textData}` };
      } else {
        contentPart = await fileToPart(file);
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [contentPart, { text: "Extraia os códigos de infração para um ARRAY JSON." }] },
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
    } catch (e) {
      console.error(e);
    }
  }
  return results;
};