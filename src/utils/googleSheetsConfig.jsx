// Google Sheets API configuration
import { loadFacultyConfig } from './facultyConfig';

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

export const fetchProfessorsData = async (facultyId = 'FIE') => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Normalize faculty ID to uppercase to match stored configuration
      const normalizedFacultyId = facultyId.toUpperCase();
      
      const config = loadFacultyConfig(normalizedFacultyId);
      if (!config) {
        throw new Error(`No configuration found for faculty: ${normalizedFacultyId}`);
      }
      
      // Verify that we have the necessary configuration
      if (!config.spreadsheetId || !config.apiKey || !config.selectedSheet) {
        console.error('Missing required configuration:', { 
          hasSpreadsheetId: !!config.spreadsheetId, 
          hasApiKey: !!config.apiKey,
          hasSelectedSheet: !!config.selectedSheet
        });
        throw new Error(`Configuración incompleta para la facultad: ${normalizedFacultyId}. Por favor, configure el ID de la hoja de cálculo, la clave API y seleccione una hoja.`);
      }
      
      // Verify that we have field mappings with column indices
      const hasMappedColumns = Object.values(config.fieldMappings).some(field => {
        // Check if columnIndex exists and can be parsed as a number
        const hasValidIndex = field.columnIndex !== undefined && 
                             field.columnIndex !== null && 
                             field.columnIndex !== '' && 
                             !isNaN(parseInt(field.columnIndex)) &&
                             parseInt(field.columnIndex) >= 0;
        if (hasValidIndex) {
          console.log('Found valid column index:', field.columnIndex);
          return true;
        }
        return false;
      });
      
      if (!hasMappedColumns) {
        console.error('No column mappings found in configuration');
        throw new Error('No se han configurado las columnas. Por favor, configure el mapeo de columnas en el panel de administración.');
      }
      
      // Make sure we're using the correct sheet URL with the selected sheet
      const sheetUrl = getSheetUrl(normalizedFacultyId);
      console.log('Sheet URL:', sheetUrl);
      
      const response = await fetch(`${sheetUrl}?key=${config.apiKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        const errorMessage = `Error de servidor (${response.status}). Por favor, verifique la configuración de la API de Google Sheets.`;
        if (retries < MAX_RETRIES - 1) {
          console.warn(`Attempt ${retries + 1} failed, retrying...`);
          await delay(RETRY_DELAY);
          retries++;
          continue;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Response headers:', response.headers);
      console.log('Data structure:', JSON.stringify(data, null, 2));
      
      if (!data.values || !Array.isArray(data.values)) {
        console.warn('No valid data array found in the response');
        throw new Error('Invalid data format received from Google Sheets API');
      }
      
      const fieldMappings = config.fieldMappings;
      console.log('Using field mappings:', JSON.stringify(fieldMappings, null, 2));
      
      // Log the first row of data to help with debugging
      if (data.values.length > 0) {
        console.log('First row of data:', data.values[0]);
        console.log('Column mappings applied to first row:');
        Object.entries(fieldMappings).forEach(([key, fieldConfig]) => {
          if (fieldConfig.columnIndex !== undefined) {
            const columnIndex = parseInt(fieldConfig.columnIndex);
            if (!isNaN(columnIndex)) {
              console.log(`${key}: Column ${columnIndex} -> ${data.values[0][columnIndex] || 'undefined'}`);
            }
          }
        });
      }
      
      return data.values.map(row => {
        const professor = {};
        
        // Initialize with default empty values for all possible fields
        Object.keys(fieldMappings).forEach(key => {
          professor[key] = '';
        });
        
        // Fill in values based on column mappings from configuration
        Object.entries(fieldMappings).forEach(([key, fieldConfig]) => {
          // More robust check for valid column index
          if (fieldConfig && fieldConfig.columnIndex !== undefined && fieldConfig.columnIndex !== null && fieldConfig.columnIndex !== '') {
            const columnIndex = parseInt(fieldConfig.columnIndex);
            if (!isNaN(columnIndex) && columnIndex >= 0 && columnIndex < row.length) {
              professor[key] = row[columnIndex] || ''; // Accept empty strings as valid values
            } else {
              console.warn(`Invalid column index for ${key}: ${fieldConfig.columnIndex}`);
            }
          }
        });
        
        // Log the mapped professor object for debugging
        if (retries === 0 && row === data.values[0]) {
          console.log('Mapped professor object:', professor);
        }
        
        // Ensure critical fields have at least empty string values
        return {
          ...professor,
          cedula: professor.cedula || '',
          nombres: professor.nombres || '',
          apellidos: professor.apellidos || '',
          email: professor.email || '',
          carrera: professor.carrera || ''
        };
      });
    } catch (error) {
      console.error('Error fetching professors data:', error.message);
      console.error('Full error:', error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Error de conexión. Por favor, verifique su conexión a internet y vuelva a intentarlo.');
      } else if (error.message.includes('Unexpected token')) {
        throw new Error('Error en el formato de datos. Por favor, verifique la estructura de la hoja de cálculo.');
      } else {
        throw new Error(error.message);
      }
    }
  }
  throw new Error('No se pudieron cargar los datos después de varios intentos. Por favor, verifique la configuración de la facultad.');
};
