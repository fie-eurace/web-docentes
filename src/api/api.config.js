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

  // Obtener la configuración de una facultad
export const getFacultyConfig = async (facultyName) => {
    try {
        const response = await fetch(`${API_URL}/${facultyName}`);
        if (!response.ok) throw new Error("No se encontró la facultad");

        return await response.json();
    } catch (error) {
        console.error("Error obteniendo configuración de la facultad:", error);
        throw error;
    }
};

// Guardar los mapeos de columnas en FieldMapping
export const saveFieldMappings = async (facultyId, fieldMappings) => {
  try {
      const response = await fetch(`${API_URL}/${facultyId}/mappings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldMappings }),
      });

      if (!response.ok) throw new Error("Error al guardar el mapeo de columnas");

      return await response.json();
  } catch (error) {
      console.error("Error guardando mapeo de columnas:", error);
      throw error;
  }
};