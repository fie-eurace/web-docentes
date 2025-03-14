// src/services/apiService.js
const API_URL = 'http://localhost:4000/faculties';

// ✅ Obtener todas las facultades
export const getFaculties = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error al obtener facultades");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo facultades:", error);
    throw error;
  }
};

// ✅ Actualizar una facultad existente
export const updateFaculty = async (facultyId, { name, spreadsheetId, apiKey, selectedSheet, fieldMappings }) => {
  try {
    const response = await fetch(`${API_URL}/${facultyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        spreadsheetId,
        apiKey,
        selectedSheet,
        fieldMappings,
      }),
    });

    if (!response.ok) throw new Error("Error al actualizar la facultad");

    return await response.json();
  } catch (error) {
    console.error("Error actualizando facultad:", error);
    throw error;
  }
};

// ✅ Eliminar una facultad por ID
export const deleteFaculty = async (facultyId) => {
  try {
    const response = await fetch(`${API_URL}/${facultyId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar la facultad");

    return await response.json();
  } catch (error) {
    console.error("Error eliminando la facultad:", error);
    throw error;
  }
};

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