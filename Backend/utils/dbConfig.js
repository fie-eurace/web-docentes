// Database configuration utility
import { PrismaClient } from "@prisma/client";

// Ensure we use a singleton instance of PrismaClient
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ✅ Obtener todas las facultades
export const getFaculties = async () => {
  try {
    return await prisma.faculty.findMany({
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    throw new Error("Failed to fetch faculties");
  }
};

// ✅ Obtener una facultad por ID
export const getFacultyById = async (id) => {
  try {
    return await prisma.faculty.findUnique({
      where: { id },
      include: { fieldMappings: true }
    });
  } catch (error) {
    console.error(`Error fetching faculty with ID ${id}:`, error);
    throw new Error("Faculty not found");
  }
};

// ✅ Obtener una facultad por nombre (case-insensitive workaround)
export const getFacultyByName = async (name) => {
  try {
    const faculties = await prisma.faculty.findMany();
    return faculties.find((faculty) => faculty.name.toLowerCase() === name.toLowerCase()) || null;
  } catch (error) {
    console.error(`Error fetching faculty with name ${name}:`, error);
    throw new Error("Faculty not found");
  }
};

// ✅ Convertir una facultad a formato de aplicación
export const convertFacultyToAppFormat = (faculty) => {
  if (!faculty) return null;

  const fieldMappings = {};
  faculty.fieldMappings.forEach((mapping) => {
    fieldMappings[mapping.fieldKey] = {
      label: mapping.label,
      columnIndex: mapping.columnIndex,
      displayIn: JSON.parse(mapping.displayIn || "[]")
    };
  });

  return {
    name: faculty.name,
    spreadsheetId: faculty.spreadsheetId || "",
    apiKey: faculty.apiKey || "",
    selectedSheet: {
      title: faculty.sheetTitle || "Sheet1",
      sheetId: faculty.sheetId || "0"
    },
    fieldMappings,
    logo: faculty.logo || "",
    primaryColor: faculty.primaryColor || "#234e94"
  };
};

// ✅ Crear una nueva facultad con validación
export const createFaculty = async (facultyData) => {
  try {
    if (!facultyData || typeof facultyData !== "object") {
      throw new Error("Los datos de la facultad son inválidos");
    }

    if (!facultyData.name || facultyData.name.trim() === "") {
      throw new Error("El nombre de la facultad no puede estar vacío");
    }

    const existingFaculty = await prisma.faculty.findFirst({
      where: { name: facultyData.name.trim() }
    });

    if (existingFaculty) {
      throw new Error(`La facultad ${facultyData.name} ya existe`);
    }

    const faculty = await prisma.faculty.create({
      data: {
        ...facultyData,
        name: facultyData.name.trim(),
      },
    });

    console.log(`✅ Facultad creada correctamente: ${faculty.name}`);
    return faculty;
  } catch (error) {
    console.error("❌ Error al crear facultad:", error.message);
    throw new Error(error.message);
  }
};


// ✅ Actualizar una facultad con validación
export const updateFaculty = async (id, facultyData) => {
  try {
    const { fieldMappings, ...facultyFields } = facultyData;

    // Eliminar mapeos anteriores
    await prisma.fieldMapping.deleteMany({
      where: { facultyId: id }
    });

    // Actualizar facultad y crear nuevos mapeos
    const faculty = await prisma.faculty.update({
      where: { id },
      data: {
        ...facultyFields,
        fieldMappings: {
          create: fieldMappings.map((mapping) => ({
            ...mapping,
            displayIn: JSON.stringify(mapping.displayIn)
          }))
        }
      },
      include: { fieldMappings: true }
    });

    return faculty;
  } catch (error) {
    console.error("Error updating faculty:", error);
    throw new Error("Failed to update faculty");
  }
};

// ✅ Eliminar una facultad
export const deleteFaculty = async (id) => {
  try {
    await prisma.faculty.delete({
      where: { id }
    });
    console.log(`Faculty with ID ${id} deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting faculty:", error);
    throw new Error("Failed to delete faculty");
  }
};

export default prisma;
