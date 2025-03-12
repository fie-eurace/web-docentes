// Google Sheets API configuration
import { loadFacultyConfig } from './facultyConfig';
import { getFacultyConfig } from '../api/api.config';

export const getSheetUrl = (facultyId = 'FIE', range = 'A2:P1000') => {
  // Normalize faculty ID to uppercase to match stored configuration
  const normalizedFacultyId = facultyId.toUpperCase();
  const config = loadFacultyConfig(normalizedFacultyId);
  console.log('Faculty config:', config);
  
  // Check if selectedSheet exists and has a title property
  let sheetName = null;
  if (config.selectedSheet && typeof config.selectedSheet === 'object' && config.selectedSheet.title) {
    sheetName = config.selectedSheet.title;
  } else if (!config.selectedSheet) {
    console.warn('No selectedSheet found in configuration, using default sheet');
  }
  console.log('Selected sheet name:', sheetName);
  
  const fullRange = sheetName ? `${sheetName}!${range}` : range;
  console.log('Full range:', fullRange);
  return `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${fullRange}`;
};

// Get sheet headers (first row)
export const fetchSheetHeaders = async (spreadsheetId, apiKey, sheetName) => {
  try {
    // Use the sheet name in the request if provided
    const range = sheetName ? `${sheetName}!A1:Z1` : 'A1:Z1';
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Error de servidor (${response.status}). Por favor, verifique la configuración de la API de Google Sheets.`);
    }
    
    const data = await response.json();
    
    if (!data.values || !Array.isArray(data.values) || data.values.length === 0) {
      throw new Error('No se encontraron encabezados en la hoja de cálculo');
    }
    
    // Return the headers as an array of objects with index and name
    return data.values[0].map((header, index) => ({
      index,
      name: header || `Column ${index + 1}`
    }));
  } catch (error) {
    console.error('Error fetching sheet headers:', error);
    throw error;
  }
};

// Get available sheets from a spreadsheet
export const fetchAvailableSheets = async (spreadsheetId, apiKey) => {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Error de servidor (${response.status}). Por favor, verifique la configuración de la API de Google Sheets.`);
    }
    
    const data = await response.json();
    
    if (!data.sheets || !Array.isArray(data.sheets)) {
      throw new Error('No se encontraron hojas en el documento');
    }
    
    // Return the sheets as an array of objects with title and sheetId
    return data.sheets.map(sheet => ({
      title: sheet.properties.title,
      sheetId: sheet.properties.sheetId
    }));
  } catch (error) {
    console.error('Error fetching available sheets:', error);
    throw error;
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchProfessorsData = async (facultyName) => {
  try {
      console.log("📌 Buscando configuración para la facultad:", facultyName);

      // ✅ Obtener configuración correcta de la API
      const config = await getFacultyConfig(facultyName);  // ✅ Aquí se pasa el nombre, no el spreadsheetId
      
      console.log("✅ Configuración obtenida en fetchProfessorsData:", config);

      if (!config || !config.spreadsheetId || !config.apiKey || !config.selectedSheet?.title) {
          throw new Error(`Configuración incompleta para la facultad: ${facultyName}.`);
      }

      // ✅ Construir la URL con el spreadsheetId y el título de la hoja correcta
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.selectedSheet.title}!A2:P1000?key=${config.apiKey}`;
      
      console.log("🔗 URL de la hoja de cálculo:", sheetUrl);

      const response = await fetch(sheetUrl);
      if (!response.ok) {
          throw new Error(`Error de servidor (${response.status}) al obtener datos de Google Sheets.`);
      }

      const data = await response.json();
      console.log("📥 Datos obtenidos de Google Sheets:", data);

      if (!data.values || !Array.isArray(data.values)) {
          throw new Error("Formato de datos inválido desde Google Sheets.");
      }

      return data.values.map(row => ({
          nombres: row[1] || "N/A",
          apellidos: row[2] || "N/A",
          carrera: row[7] || "N/A",
          email: row[3] || "",
          url_imagen: row[8] || "",
          relacion_laboral: row[6] || "N/A"
      }));

  } catch (error) {
      console.error("❌ Error en fetchProfessorsData:", error.message);
      throw error;
  }
};



