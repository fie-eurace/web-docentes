// src/services/apiService.js
const API_URL = 'http://localhost:4000/faculties';

export const saveFacultyToBackend = async ({ name, spreadsheetId, apiKey }) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          spreadsheetId: spreadsheetId || '',
          apiKey: apiKey || '',
          fieldMappings: {} // Se envía vacío para evitar `undefined`
        }),
      });
  
      if (!response.ok) {
        throw new Error('Error al guardar la facultad en el backend');
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error al guardar en backend:", error);
      throw error;
    }
  };