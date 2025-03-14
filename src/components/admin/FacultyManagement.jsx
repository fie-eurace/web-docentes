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
  CircularProgress,
  Collapse
} from '@mui/material';
import { Add, Delete, Refresh, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchAvailableSheets, fetchSheetHeaders } from '../../utils/googleSheetsConfig';
import { saveFacultyToBackend, getFaculties, getFacultyConfig, updateFaculty, deleteFaculty } from '../../api/api.config';

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newSpreadsheetId, setNewSpreadsheetId] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newSelectedSheet, setNewSelectedSheet] = useState('');
  const [editSpreadsheetId, setEditSpreadsheetId] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editSelectedSheet, setEditSelectedSheet] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ type: '', text: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);


  const navigate = useNavigate();

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const data = await getFaculties();
        setFaculties(data);
      } catch (error) {
        console.error("Error al cargar facultades:", error);
      }
    };
  
    fetchFaculties();
  }, []);

  useEffect(() => {
    const fetchFacultyData = async () => {
      if (!selectedFaculty) {
        setEditSpreadsheetId('');
        setEditApiKey('');
        setEditSelectedSheet('');
        return;
      }
  
      try {
        const faculty = await getFacultyConfig(selectedFaculty);
        setEditSpreadsheetId(faculty.spreadsheetId || '');
        setEditApiKey(faculty.apiKey || '');
        setEditSelectedSheet(faculty.selectedSheet?.sheetId ? String(faculty.selectedSheet.sheetId) : '');
      } catch (error) {
        console.error("Error obteniendo la configuración de la facultad:", error);
      }
    };
  
    fetchFacultyData();
  }, [selectedFaculty]);
  
  const toggleAdd = () => {
    setShowAdd(!showAdd);
    if (!showAdd) setShowEdit(false); // Cierra Editar si se abre Agregar
  };
  
  const toggleEdit = () => {
    setShowEdit(!showEdit);
    if (!showEdit) setShowAdd(false); // Cierra Agregar si se abre Editar
  };

  const handleAddFaculty = async () => {
    if (!newFacultyName.trim()) {
      setDialogMessage({ type: 'error', text: 'El nombre de la facultad es obligatorio' });
      setOpenDialog(true);
      return;
    }
  
    try {
      await saveFacultyToBackend({
        name: newFacultyName.trim(),
        spreadsheetId: newSpreadsheetId.trim(),
        apiKey: newApiKey.trim(),
        selectedSheet: availableSheets.find(sheet => sheet.sheetId === newSelectedSheet) || { title: "Sheet1", sheetId: "0" }
      });
  
      setNewFacultyName('');
      setNewSpreadsheetId('');
      setNewApiKey('');
      setNewSelectedSheet('');
      setDialogMessage({ type: 'success', text: 'Facultad agregada correctamente' });
      setFaculties(await getFaculties());
    } catch (error) {
      setDialogMessage({ type: 'error', text: 'Error al guardar la facultad' });
    }
  
    setOpenDialog(true);
  };
  
  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;
  
    try {
      const faculty = await getFacultyConfig(selectedFaculty); // Obtener ID desde el nombre
      await deleteFaculty(faculty.id);
      setDialogMessage({ type: 'success', text: 'Facultad eliminada correctamente' });
      setFaculties(await getFaculties());
      setSelectedFaculty('');
    } catch (error) {
      setDialogMessage({ type: 'error', text: 'Error al eliminar la facultad' });
    }
  
    setOpenDialog(true);
  };

  const handleLoadSheets = async () => {
    const sheetIdToUse = showAdd ? newSpreadsheetId : editSpreadsheetId;
    const apiKeyToUse = showAdd ? newApiKey : editApiKey;
  
    if (!sheetIdToUse || !apiKeyToUse) {
      setDialogMessage({ type: 'error', text: 'Ingrese el ID de la hoja y la clave API' });
      setOpenDialog(true);
      return;
    }
  
    setLoading(true);
    try {
      const sheets = await fetchAvailableSheets(sheetIdToUse, apiKeyToUse);
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
    if (!selectedFaculty.trim()) {
      setDialogMessage({ type: 'error', text: 'El nombre de la facultad no puede estar vacío' });
      setOpenDialog(true);
      return;
    }
  
    try {
      const faculty = await getFacultyConfig(selectedFaculty);
  
      await updateFaculty(faculty.id, {
        name: selectedFaculty.trim(),
        spreadsheetId: editSpreadsheetId.trim(),
        apiKey: editApiKey.trim(),
        selectedSheet: {
          title: availableSheets.find(sheet => sheet.sheetId === editSelectedSheet)?.title || "Sheet1",
          sheetId: String(editSelectedSheet) // 🔴 Convertimos a String
        },
        fieldMappings: {}
      });
  
      setDialogMessage({ type: 'success', text: 'Configuración actualizada correctamente' });
    } catch (error) {
      setDialogMessage({ type: 'error', text: 'Error al actualizar la configuración' });
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
          key={faculty.id}
          variant="contained"
          sx={{ backgroundColor: '#b41a12', color: 'white' }}
          onClick={() => navigate(`/${faculty.name}`)}
        >
          {faculty.name}
        </Button>
      ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Button fullWidth variant="contained" color="primary" onClick={toggleAdd} sx={{ mb: 1 }}>
        {showAdd ? 'Ocultar Agregar Configuración' : 'Agregar Configuración'}
      </Button>
      <Button fullWidth variant="contained" color="secondary" onClick={toggleEdit}>
        {showEdit ? 'Ocultar Editar Configuración' : 'Editar Configuración'}
      </Button>


      <Collapse in={showAdd}>
        <Typography variant="h6" gutterBottom>
          Agregar Nueva Facultad
        </Typography>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Nombre de la Facultad" value={newFacultyName} onChange={e => setNewFacultyName(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="ID de la Hoja de Cálculo" value={newSpreadsheetId} onChange={e => setNewSpreadsheetId(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Clave API" value={newApiKey} onChange={e => setNewApiKey(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleLoadSheets} disabled={loading} sx={{ mb: 2 }}>
            {loading ? <CircularProgress size={24} /> : 'Cargar Hojas Disponibles'}
          </Button>
            <FormControl fullWidth>
              <InputLabel>Seleccionar Hoja</InputLabel>
              <Select value={newSelectedSheet} onChange={e => setNewSelectedSheet(e.target.value)}>
                {availableSheets.map(sheet => (
                  <MenuItem key={sheet.sheetId} value={sheet.sheetId}>
                    {sheet.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button fullWidth variant="contained" color="primary" startIcon={<Save />} onClick={handleAddFaculty}>
              Agregar Facultad
            </Button>
          </Grid>
        </Grid>
      </Collapse>


      <Divider sx={{ my: 2 }} />

      <Collapse in={showEdit}>
        <Typography variant="h6" gutterBottom>
          Configurar Facultad Existente
        </Typography>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Seleccionar Facultad</InputLabel>
              <Select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}>
                {faculties.map(faculty => (
                  <MenuItem key={faculty.id} value={faculty.name}>
                    {faculty.name}
                  </MenuItem>
                ))}
              </Select>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDeleteFaculty}
                  disabled={!selectedFaculty}
                >
                  Eliminar Facultad
                </Button>
              </Grid>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="ID de la Hoja de Cálculo" value={editSpreadsheetId} onChange={e => setEditSpreadsheetId(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Clave API" value={editApiKey} onChange={e => setEditApiKey(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleLoadSheets} disabled={loading} sx={{ mb: 2 }}>
            {loading ? <CircularProgress size={24} /> : 'Cargar Hojas Disponibles'}
          </Button>
            <FormControl fullWidth>
              <InputLabel>Seleccionar Hoja</InputLabel>
              <Select value={editSelectedSheet} onChange={e => setEditSelectedSheet(e.target.value)}>
                {availableSheets.map(sheet => (
                  <MenuItem key={sheet.sheetId} value={sheet.sheetId}>
                    {sheet.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button fullWidth variant="contained" color="primary" startIcon={<Save />} onClick={handleSaveConfiguration}>
              Guardar Cambios
            </Button>
          </Grid>
        </Grid>
      </Collapse>
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
