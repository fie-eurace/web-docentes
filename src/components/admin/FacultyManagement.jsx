import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  CircularProgress
} from '@mui/material';
import { Add, Delete, Refresh, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchAvailableSheets, fetchSheetHeaders } from '../../utils/googleSheetsConfig';
import { saveFacultyToBackend } from '../../api/api.config';

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [newFacultyName, setNewFacultyName] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ type: '', text: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const storedFaculties = Object.keys(localStorage)
      .filter(key => key.startsWith('faculty_'))
      .map(key => key.replace('faculty_', ''));
    setFaculties(storedFaculties);
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      const config = JSON.parse(localStorage.getItem(`faculty_${selectedFaculty}`));
      setSpreadsheetId(config?.spreadsheetId || '');
      setApiKey(config?.apiKey || '');
    } else {
      setSpreadsheetId('');
      setApiKey('');
    }
  }, [selectedFaculty]);

  const handleAddFaculty = () => {
    if (!newFacultyName.trim()) {
      setDialogMessage({ type: 'error', text: 'El nombre de la facultad es obligatorio' });
      setOpenDialog(true);
      return;
    }

    const facultyId = newFacultyName.trim();
    localStorage.setItem(`faculty_${facultyId}`, JSON.stringify({ name: facultyId, spreadsheetId: '', apiKey: '' }));
    setFaculties([...faculties, facultyId]);
    setNewFacultyName('');
    setDialogMessage({ type: 'success', text: `Facultad "${facultyId}" agregada correctamente` });
    setOpenDialog(true);
  };

  const handleDeleteFaculty = () => {
    if (selectedFaculty) {
      localStorage.removeItem(`faculty_${selectedFaculty}`);
      setFaculties(faculties.filter(f => f !== selectedFaculty));
      setSelectedFaculty('');
      setDialogMessage({ type: 'success', text: 'Facultad eliminada correctamente' });
      setOpenDialog(true);
    }
  };

  const handleLoadSheets = async () => {
    if (!spreadsheetId || !apiKey) {
      setDialogMessage({ type: 'error', text: 'Ingrese el ID de la hoja y la clave API' });
      setOpenDialog(true);
      return;
    }

    setLoading(true);
    try {
      const sheets = await fetchAvailableSheets(spreadsheetId, apiKey);
      setAvailableSheets(sheets);
      setDialogMessage({ type: 'success', text: `Se encontraron ${sheets.length} hojas disponibles` });
    } catch (error) {
      setDialogMessage({ type: 'error', text: 'Error al cargar las hojas' });
    } finally {
      setLoading(false);
      setOpenDialog(true);
    }
  };

  const handleSheetChange = async (event) => {
    const sheetId = event.target.value;
    const selectedSheet = availableSheets.find(sheet => sheet.sheetId === sheetId);
    setSelectedSheet(selectedSheet.sheetId);

    if (!selectedSheet) return;

    try {
      setLoading(true);
      const headers = await fetchSheetHeaders(spreadsheetId, apiKey, selectedSheet.title);
      setDialogMessage({ type: 'success', text: `La hoja "${selectedSheet.title}" tiene ${headers.length} columnas` });
    } catch (error) {
      setDialogMessage({ type: 'error', text: 'Error al obtener las columnas de la hoja seleccionada' });
    } finally {
      setLoading(false);
      setOpenDialog(true);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!selectedFaculty || selectedFaculty.trim() === "") {
        setDialogMessage({ type: 'error', text: 'El nombre de la facultad no puede estar vacío' });
        setOpenDialog(true);
        return;
    }

    if (!spreadsheetId.trim() || !apiKey.trim() || !selectedSheet) {
        setDialogMessage({ type: 'error', text: 'Debe llenar todos los campos' });
        setOpenDialog(true);
        return;
    }

    const selectedSheetData = availableSheets.find(sheet => sheet.sheetId === selectedSheet) || { title: 'Hoja1', sheetId: '0' };

    const facultyData = {
        name: selectedFaculty.trim(),
        spreadsheetId: spreadsheetId.trim(),
        apiKey: apiKey.trim(),
        selectedSheet: {
            title: selectedSheetData.title,
            sheetId: String(selectedSheetData.sheetId) // 🔴 Convertir a String
        }
    };

    try {
        console.log('📤 Enviando datos al backend:', facultyData);

        const response = await fetch("http://localhost:4000/faculties", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(facultyData),
        });

        const result = await response.json();
        console.log('📥 Respuesta del backend:', result);

        if (!response.ok) {
            throw new Error(result.error || 'Error desconocido al guardar la configuración');
        }

        setDialogMessage({ type: 'success', text: result.message || 'Configuración guardada correctamente' });

    } catch (error) {
        console.error('⛔ Error al guardar la configuración:', error);
        setDialogMessage({ type: 'error', text: `Error al guardar la configuración: ${error.message}` });
    }

    setOpenDialog(true);
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Facultades
      </Typography>

      <Typography variant="h6" gutterBottom>
        Facultades Disponibles
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {faculties.map(faculty => (
          <Button
            key={faculty}
            variant="contained"
            sx={{ backgroundColor: '#b41a12', color: 'white' }}
            onClick={() => navigate(`/${faculty}`)}
          >
            {faculty}
          </Button>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Agregar Nueva Facultad
      </Typography>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={9}>
          <TextField fullWidth label="Nombre de la Facultad" value={newFacultyName} onChange={e => setNewFacultyName(e.target.value)} />
        </Grid>
        <Grid item xs={3}>
          <Button fullWidth variant="contained" color="error" startIcon={<Add />} onClick={handleAddFaculty}>
            Agregar
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Configurar Facultad Existente
      </Typography>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={9}>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Facultad</InputLabel>
            <Select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}>
              {faculties.map(faculty => (
                <MenuItem key={faculty} value={faculty}>
                  {faculty}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          <Button fullWidth variant="contained" color="error" startIcon={<Delete />} onClick={handleDeleteFaculty} disabled={!selectedFaculty}>
            Eliminar
          </Button>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>
        Configuración de Google Sheets
      </Typography>
      <TextField fullWidth label="ID de la Hoja de Cálculo" value={spreadsheetId} onChange={e => setSpreadsheetId(e.target.value)} sx={{ mb: 2 }} />
      <TextField fullWidth label="Clave API" value={apiKey} onChange={e => setApiKey(e.target.value)} sx={{ mb: 2 }} />

      <Button variant="outlined" startIcon={<Refresh />} onClick={handleLoadSheets} disabled={loading} sx={{ mb: 2 }}>
        {loading ? <CircularProgress size={24} /> : 'Cargar Hojas Disponibles'}
      </Button>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Seleccionar Hoja</InputLabel>
        <Select value={selectedSheet} onChange={handleSheetChange}>
          {availableSheets.map(sheet => (
            <MenuItem key={sheet.sheetId} value={sheet.sheetId}>
              {sheet.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button fullWidth variant="contained" color="primary" startIcon={<Save />} onClick={handleSaveConfiguration}>
        Guardar Configuración
      </Button>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{dialogMessage.type === 'success' ? 'Éxito' : 'Error'}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogMessage.text}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FacultyManagement;
