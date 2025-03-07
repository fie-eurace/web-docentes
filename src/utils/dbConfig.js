// Database configuration utility
import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient using a more reliable pattern
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Faculty operations
export const getFaculties = async () => {
  try {
    return await prisma.faculty.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return [];
  }
};

export const getFacultyById = async (id) => {
  try {
    return await prisma.faculty.findUnique({
      where: { id },
      include: { fieldMappings: true }
    });
  } catch (error) {
    console.error(`Error fetching faculty with ID ${id}:`, error);
    return null;
  }
};

export const getFacultyByName = async (name) => {
  try {
    // Normalize faculty name to uppercase for consistent retrieval
    const normalizedName = name.toUpperCase();
    return await prisma.faculty.findUnique({
      where: { name: normalizedName },
      include: { fieldMappings: true }
    });
  } catch (error) {
    console.error(`Error fetching faculty with name ${name}:`, error);
    return null;
  }
};

// Convert database faculty model to application format
export const convertFacultyToAppFormat = (faculty) => {
  if (!faculty) return null;

  const fieldMappings = {};
  faculty.fieldMappings.forEach(mapping => {
    fieldMappings[mapping.fieldKey] = {
      label: mapping.label,
      columnIndex: mapping.columnIndex,
      displayIn: JSON.parse(mapping.displayIn || '[]')
    };
  });

  return {
    name: faculty.name,
    spreadsheetId: faculty.spreadsheetId || '',
    apiKey: faculty.apiKey || '',
    selectedSheet: {
      title: faculty.sheetTitle || 'Sheet1',
      sheetId: faculty.sheetId || '0'
    },
    fieldMappings,
    logo: faculty.logo || '',
    primaryColor: faculty.primaryColor || '#234e94'
  };
};

// Create a new faculty
export const createFaculty = async (facultyData) => {
  try {
    const { fieldMappings, ...facultyFields } = facultyData;
    
    // Ensure fieldMappings is an array
    const mappingsArray = Array.isArray(fieldMappings) ? fieldMappings : Object.entries(fieldMappings).map(([key, value]) => ({
      fieldKey: key,
      label: value.label || key,
      columnIndex: value.columnIndex,
      displayIn: JSON.stringify(value.displayIn || [])
    }));

    // Validate that the faculty name is not empty
    if (!facultyFields.name || facultyFields.name.trim() === '') {
      throw new Error('Faculty name cannot be empty');
    }

    // Check if faculty with this name already exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { name: facultyFields.name }
    });

    if (existingFaculty) {
      throw new Error(`Faculty with name ${facultyFields.name} already exists`);
    }

    const faculty = await prisma.faculty.create({
      data: {
        ...facultyFields,
        fieldMappings: {
          create: mappingsArray
        }
      },
      include: { fieldMappings: true }
    });
    
    console.log(`Faculty ${facultyFields.name} created successfully:`, faculty);
    return faculty;
  } catch (error) {
    console.error('Error creating faculty:', error);
    throw error; // Propagate the error instead of returning null
  }
};

// Update an existing faculty
export const updateFaculty = async (id, facultyData) => {
  try {
    const { fieldMappings, ...facultyFields } = facultyData;
    
    // Delete existing field mappings
    await prisma.fieldMapping.deleteMany({
      where: { facultyId: id }
    });

    // Update faculty and create new field mappings
    const faculty = await prisma.faculty.update({
      where: { id },
      data: {
        ...facultyFields,
        fieldMappings: {
          create: fieldMappings.map(mapping => ({
            ...mapping,
            displayIn: JSON.stringify(mapping.displayIn)
          }))
        }
      },
      include: { fieldMappings: true }
    });
    return faculty;
  } catch (error) {
    console.error('Error updating faculty:', error);
    throw error; // Propagate the error instead of returning null
  }
};

export default prisma;