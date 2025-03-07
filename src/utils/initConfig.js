import { saveFacultyConfig } from './facultyConfig';
import { getFacultyByName } from './dbConfig';
import { FRN_CONFIG } from '../config/frn.config';
import { FIE_CONFIG } from '../config/fie.config';

export const initializeFacultyConfigs = async () => {
  try {
    // Initialize FRN configuration
    const frnConfig = {
      ...FRN_CONFIG,
      name: 'FRN'
    };
    
    // Initialize FIE configuration using the dedicated FIE config file
    const fieConfig = {
      ...FIE_CONFIG,
      name: 'FIE'
    };
    
    // Check if faculties exist in database and save if they don't
    const frnExists = await getFacultyByName('FRN');
    if (!frnExists) {
      await saveFacultyConfig('FRN', frnConfig);
    }
    
    const fieExists = await getFacultyByName('FIE');
    if (!fieExists) {
      await saveFacultyConfig('FIE', fieConfig);
    }
    
    console.log('Faculty configurations initialized');
  } catch (error) {
    console.error('Error initializing faculty configurations:', error);
  }
};