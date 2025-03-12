// src/services/facultyService.js
  export const loadFaculties = () => {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('faculty_'))
      .map(key => key.replace('faculty_', ''));
  };
  
  export const saveFacultyConfig = (facultyId, config) => {
    try {
      localStorage.setItem(`faculty_${facultyId}`, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error("Error saving faculty config:", error);
      return false;
    }
  };
  
  export const loadFacultyConfig = (facultyId) => {
    const data = localStorage.getItem(`faculty_${facultyId}`);
    return data ? JSON.parse(data) : { spreadsheetId: '', apiKey: '' };
  };
  
  export const deleteFacultyConfig = (facultyId) => {
    localStorage.removeItem(`faculty_${facultyId}`);
  };

  