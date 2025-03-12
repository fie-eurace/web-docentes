import express from 'express';
import cors from 'cors';
import { getFaculties, createFaculty, deleteFaculty, getFacultyByName, upsertFieldMappings } from './utils/dbConfig.js';

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Ruta para obtener todas las facultades
app.get('/faculties', async (req, res) => {
  try {
    const faculties = await getFaculties();
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/faculties/:id', async (req, res) => {
  try {
    const { name, spreadsheetId, apiKey, selectedSheet, fieldMappings } = req.body;

    const updatedFaculty = await prisma.faculty.update({
      where: { id: req.params.id },
      data: {
        name,
        spreadsheetId,
        apiKey,
        sheetTitle: selectedSheet?.title || "",
        sheetId: selectedSheet?.sheetId || "",
        fieldMappings: {
          deleteMany: {}, // Eliminar antiguos mapeos
          create: fieldMappings ? Object.entries(fieldMappings).map(([key, value]) => ({
            fieldKey: key,
            label: value.label || key,
            columnIndex: value.columnIndex,
            displayIn: JSON.stringify(value.displayIn || [])
          })) : []
        }
      },
      include: { fieldMappings: true }
    });

    res.json(updatedFaculty);
  } catch (error) {
    console.error("Error al actualizar facultad:", error);
    res.status(500).json({ error: error.message });
  }
});


// ✅ Ruta para agregar una facultad
app.post('/faculties', async (req, res) => {
  try {
    const { name, spreadsheetId, apiKey, selectedSheet } = req.body;

    if (!name) return res.status(400).json({ error: 'Nombre de la facultad es requerido' });

    // Verificar si la facultad ya existe
    let faculty = await prisma.faculty.findFirst({
      where: { name }
    });

    const facultyData = {
      spreadsheetId: spreadsheetId || '',
      apiKey: apiKey || '',
      sheetTitle: selectedSheet?.title || '',
      sheetId: selectedSheet?.sheetId ? String(selectedSheet.sheetId) : '', // 🔴 Convertir a String
      updatedAt: new Date()
    };

    if (faculty) {
      // Si existe, actualizarla
      faculty = await prisma.faculty.update({
        where: { id: faculty.id },
        data: facultyData
      });

      console.log('✅ Facultad actualizada:', faculty);
      return res.json({ message: 'Facultad actualizada correctamente', faculty });

    } else {
      // Si no existe, crearla
      faculty = await prisma.faculty.create({
        data: {
          name,
          ...facultyData
        }
      });

      console.log('Facultad creada:', faculty);
      return res.json({ message: 'Facultad creada correctamente', faculty });
    }

  } catch (error) {
    console.error('Error al guardar la facultad:', error);
    res.status(500).json({ error: error.message });
  }
});



// ✅ Ruta para eliminar una facultad
app.delete('/faculties/:id', async (req, res) => {
  try {
    await deleteFaculty(req.params.id);
    res.json({ message: "Facultad eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/faculties/:name', async (req, res) => {
  try {
    const faculty = await prisma.faculty.findFirst({
      where: { name: req.params.name },
      include: { fieldMappings: true }
    });

    if (!faculty) return res.status(404).json({ error: "Facultad no encontrada" });

    res.json({
      ...faculty,
      selectedSheet: faculty.sheetTitle ? { title: faculty.sheetTitle, sheetId: faculty.sheetId } : null
    });
  } catch (error) {
    console.error("Error obteniendo facultad:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/faculties/:id/mappings', async (req, res) => {
  try {
    const { fieldMappings } = req.body;
    const facultyId = req.params.id;

    if (!fieldMappings || !Array.isArray(fieldMappings)) {
      return res.status(400).json({ error: "Los mapeos de columnas son inválidos" });
    }

    const updatedMappings = await upsertFieldMappings(facultyId, fieldMappings);

    res.json({ message: "Mapeo de columnas guardado correctamente", fieldMappings: updatedMappings });
  } catch (error) {
    console.error("Error guardando mapeo de columnas:", error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar el servidor
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
