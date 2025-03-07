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
}

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
}

// Get all available faculties
export const getAvailableFaculties = async () => {
  try {
    const { getFaculties } = await import('./dbConfig.js');
    const faculties = await getFaculties();
    return faculties.map(f => f.name);
  } catch (error) {
    console.error('Error getting available faculties:', error);
    return [];
  }
}

// Load faculty configuration from database
export const loadFacultyConfig = async (facultyId = 'FIE') => {
  // Create a default config with the correct faculty name
  const defaultConfig = {
    ...DEFAULT_FACULTY_CONFIG,
    name: facultyId.toUpperCase()
  };
  
  try {
    const { getFacultyByName, convertFacultyToAppFormat } = await import('./dbConfig.js');
    const normalizedFacultyId = facultyId.toUpperCase();
    const faculty = await getFacultyByName(normalizedFacultyId);
    
    if (faculty) {
      const config = convertFacultyToAppFormat(faculty);
      console.log('Loaded faculty config for:', normalizedFacultyId, config);
      return config;
    } else {
      console.warn(`No configuration found for faculty: ${normalizedFacultyId}, using default config`);
      return defaultConfig;
    }
  } catch (error) {
    console.error('Error loading faculty configuration:', error);
    return defaultConfig;
  }
}

// Save faculty configuration to database
export const saveFacultyConfig = async (facultyId, config) => {
  try {
    const { createFaculty, updateFaculty, getFacultyByName } = await import('./dbConfig.js');
    const normalizedFacultyId = facultyId.toUpperCase();
    
    // Convert config to database format
    const facultyData = {
      name: normalizedFacultyId,
      spreadsheetId: config.spreadsheetId || '',
      apiKey: config.apiKey || '',
      sheetTitle: config.selectedSheet?.title || '',
      sheetId: config.selectedSheet?.sheetId || '',
      logo: config.logo || '',
      primaryColor: config.primaryColor || '',
      fieldMappings: Object.entries(config.fieldMappings || {}).map(([key, value]) => ({
        fieldKey: key,
        label: value.label || key,
        columnIndex: value.columnIndex,
        displayIn: JSON.stringify(Array.isArray(value.displayIn) ? value.displayIn : [])
      }))
    }
    
    // Check if faculty exists
    const existingFaculty = await getFacultyByName(normalizedFacultyId);
    
    try {
      if (existingFaculty) {
        await updateFaculty(existingFaculty.id, facultyData);
        console.log(`Faculty ${normalizedFacultyId} updated successfully`);
      } else {
        const newFaculty = await createFaculty(facultyData);
        console.log(`Faculty ${normalizedFacultyId} created successfully:`, newFaculty);
      }
      
      // Dispatch event to notify components
      const event = new CustomEvent('facultyConfigChanged', {
        detail: { facultyId: normalizedFacultyId, action: existingFaculty ? 'update' : 'add' }
      });
      document.dispatchEvent(event);
      console.log(`Event 'facultyConfigChanged' dispatched for ${normalizedFacultyId}`);
      
      return true;
    } catch (dbError) {
      console.error('Database error when saving faculty configuration:', dbError);
      throw dbError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Error saving faculty configuration:', error);
    return false;
  }
}

// Get available fields from the configuration
export const getAvailableFields = async (facultyId = 'FIE') => {
  try {
    const { getFieldMappings, getFacultyByName } = await import('./dbConfig.js');
    const normalizedFacultyId = facultyId.toUpperCase();
    const faculty = await getFacultyByName(normalizedFacultyId);
    
    if (!faculty) return [];
    
    const mappings = await getFieldMappings(faculty.id);
    return mappings.map(mapping => ({
      key: mapping.fieldKey,
      label: mapping.label || mapping.fieldKey,
      displayIn: mapping.displayIn || []
    }));
  } catch (error) {
    console.error('Error getting available fields:', error);
    return [];
  }
}

// Update field mappings for a faculty
export const updateFieldMappings = async (facultyId, mappings) => {
  try {
    const config = await loadFacultyConfig(facultyId);
    config.fieldMappings = { ...config.fieldMappings, ...mappings }
    return await saveFacultyConfig(facultyId, config);
  } catch (error) {
    console.error('Error updating field mappings:', error);
    return false;
  }
}

// Update display location for a field
export const updateFieldDisplayLocation = async (facultyId, fieldKey, locations) => {
  try {
    const { getFacultyByName, updateFieldMapping } = await import('./dbConfig.js');
    const normalizedFacultyId = facultyId.toUpperCase();
    const faculty = await getFacultyByName(normalizedFacultyId);
    
    if (!faculty) return false;
    
    // Find the field mapping
    const fieldMapping = faculty.fieldMappings.find(m => m.fieldKey === fieldKey);
    if (!fieldMapping) return false;
    
    // Update the display locations
    await updateFieldMapping(fieldMapping.id, {
      displayIn: locations
    });
    
    return true;
  } catch (error) {
    console.error('Error updating field display location:', error);
    return false;
  }
}

// Get fields that should be displayed in a specific location
export const getFieldsForDisplay = async (facultyId, location) => {
  try {
    const { getFieldMappings, getFacultyByName } = await import('./dbConfig.js');
    const normalizedFacultyId = facultyId.toUpperCase();
    const faculty = await getFacultyByName(normalizedFacultyId);
    
    if (!faculty) return [];
    
    const mappings = await getFieldMappings(faculty.id);
    return mappings
      .filter(mapping => mapping.displayIn && mapping.displayIn.includes(location))
      .map(mapping => ({
        key: mapping.fieldKey,
        label: mapping.label
      }));
  } catch (error) {
    console.error('Error getting fields for display:', error);
    return [];
  }
}