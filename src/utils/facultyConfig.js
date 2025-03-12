// Faculty configuration utility
export const DEFAULT_FIELD_MAPPINGS = {
  cedula: { label: 'ID', displayIn: ['card', 'detail'] },
  nombres: { label: 'First Name', displayIn: ['card', 'detail'] },
  apellidos: { label: 'Last Name', displayIn: ['card', 'detail'] },
  email: { label: 'Email', displayIn: ['card', 'detail'] },
  relacion_laboral: { label: 'Employment Relationship', displayIn: ['detail'] },
  titulo_phd: { label: 'PhD Title', displayIn: ['card', 'detail'] },
  dedicacion: { label: 'Dedication', displayIn: ['detail'] },
  carrera: { label: 'Career', displayIn: ['card', 'detail'] },
  ima_correo: { label: 'Email Image', displayIn: ['card', 'detail'] },
  ima_pdf: { label: 'CV PDF', displayIn: ['card', 'detail'] },
  ima_iresearch: { label: 'Research Profile', displayIn: ['card', 'detail'] },
  presentacion: { label: 'Presentation', displayIn: ['detail'] },
  docencia: { label: 'Teaching', displayIn: ['detail'] },
  url_imagen: { label: 'Profile Image', displayIn: ['card', 'detail'] },
  publicaciones: { label: 'Publications', displayIn: ['detail'] },
  grupo_investigacion: { label: 'Research Group', displayIn: ['detail'] }
};

// Display location options
export const DISPLAY_LOCATIONS = [
  { value: 'card', label: 'Tarjeta de Profesor' },
  { value: 'detail', label: 'Detalle de Profesor' },
  { value: 'list', label: 'Lista de Profesores' }
];

export const DEFAULT_FACULTY_CONFIG = {
  name: 'FIE',
  spreadsheetId: '',
  apiKey: '',
  selectedSheet: {
    title: 'Sheet1',
    sheetId: '0'
  },
  fieldMappings: DEFAULT_FIELD_MAPPINGS,
  logo: 'https://fie.espoch.edu.ec/web/image/website/1/logo/FIE?unique=b08d34e',
  primaryColor: '#234e94'
};

// Initialize faculty configurations from localStorage
export const initializeFacultyConfigs = () => {
  const configs = {};
  const storedFaculties = Object.keys(localStorage)
    .filter(key => key.startsWith('faculty_'))
    .map(key => key.replace('faculty_', ''));

  storedFaculties.forEach(facultyId => {
    const config = loadFacultyConfig(facultyId);
    configs[facultyId] = config;
  });

  return configs;
};

// Get all available faculties
export const getAvailableFaculties = () => {
  return Object.keys(localStorage)
    .filter(key => key.startsWith('faculty_'))
    .map(key => key.replace('faculty_', ''));
};

// Load faculty configuration from localStorage
export const loadFacultyConfig = async (facultyId) => {
  try {
    const normalizedFacultyId = facultyId.toUpperCase();
    
    // 🔹 Intentar obtener la configuración desde la API
    const response = await fetch(`http://localhost:4000/faculties/${normalizedFacultyId}`);
    if (response.ok) {
      const configFromApi = await response.json();
      console.log("✅ Configuración obtenida desde la API:", configFromApi);

      // Validar que los datos esenciales no sean vacíos
      if (!configFromApi.spreadsheetId || !configFromApi.apiKey || !configFromApi.selectedSheet?.title) {
        throw new Error(`Configuración incompleta en la API para ${normalizedFacultyId}`);
      }

      // Guardar la configuración en localStorage
      localStorage.setItem(`faculty_${normalizedFacultyId}`, JSON.stringify(configFromApi));
      
      return configFromApi;
    } else {
      console.warn("⚠ No se pudo obtener la configuración desde la API. Usando localStorage.");
    }
    
    // 🔹 Intentar cargar la configuración desde localStorage
    const storedConfig = localStorage.getItem(`faculty_${normalizedFacultyId}`);
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }

    console.warn(`⚠ No se encontró configuración en localStorage para ${normalizedFacultyId}.`);
    return null;
    
  } catch (error) {
    console.error("❌ Error al cargar la configuración de la facultad:", error);
    return null;
  }
};


// Save faculty configuration to localStorage
export const saveFacultyConfig = (facultyId, config) => {
  try {
    // Normalize faculty ID to uppercase for consistent storage and retrieval
    const normalizedFacultyId = facultyId.toUpperCase();
    localStorage.setItem(`faculty_${normalizedFacultyId}`, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving faculty configuration:', error);
    return false;
  }
};

// Get available fields from the configuration
export const getAvailableFields = (facultyId = 'FIE') => {
  const config = loadFacultyConfig(facultyId);
  return Object.entries(config.fieldMappings).map(([key, fieldConfig]) => ({
    key,
    label: fieldConfig.label || key,
    displayIn: fieldConfig.displayIn || []
  }));
};

// Update field mappings for a faculty
export const updateFieldMappings = (facultyId, mappings) => {
  const config = loadFacultyConfig(facultyId);
  config.fieldMappings = { ...config.fieldMappings, ...mappings };
  return saveFacultyConfig(facultyId, config);
};

// Update display location for a field
export const updateFieldDisplayLocation = (facultyId, fieldKey, locations) => {
  const config = loadFacultyConfig(facultyId);
  if (config.fieldMappings[fieldKey]) {
    config.fieldMappings[fieldKey] = {
      ...config.fieldMappings[fieldKey],
      displayIn: locations
    };
    return saveFacultyConfig(facultyId, config);
  }
  return false;
};

// Get fields that should be displayed in a specific location
export const getFieldsForDisplay = (facultyId, location) => {
  const config = loadFacultyConfig(facultyId);
  return Object.entries(config.fieldMappings)
    .filter(([_, fieldConfig]) => fieldConfig.displayIn && fieldConfig.displayIn.includes(location))
    .map(([key, fieldConfig]) => ({
      key,
      label: fieldConfig.label
    }));
};