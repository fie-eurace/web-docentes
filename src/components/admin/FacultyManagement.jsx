import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { saveFacultyConfig, loadFacultyConfig, DEFAULT_FIELD_MAPPINGS } from '../../utils/facultyConfig';

const FacultyManagement = ({
  faculties,
  selectedFaculty,
  setSelectedFaculty,
  setFaculties,
  spreadsheetId,
  setSpreadsheetId,
  apiKey,
  setApiKey,
  errors,
  setErrors
}) => {
  const [newFacultyName, setNewFacultyName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ type: '', text: '' });

  const handleAddFaculty = () => {
    if (!newFacultyName.trim()) {
      setErrors(prev => ({ ...prev, facultyName: true }));
      return;
    }

    const facultyId = newFacultyName.trim();
    const newConfig = {
      name: facultyId,
      spreadsheetId: '',
      apiKey: '',
      fieldMappings: DEFAULT_FIELD_MAPPINGS
    };

    if (saveFacultyConfig(facultyId, newConfig)) {
      setFaculties(prev => [...prev, facultyId]);
      setNewFacultyName('');
      setDialogMessage({ type: 'success', text: 'Faculty added successfully!' });
      setOpenDialog(true);
    } else {
      setDialogMessage({ type: 'error', text: 'Failed to add faculty.' });
      setOpenDialog(true);
    }
  };

  const handleDeleteFaculty = () => {
    if (selectedFaculty) {
      localStorage.removeItem(`faculty_${selectedFaculty}`);
      setFaculties(prev => prev.filter(f => f !== selectedFaculty));
      setSelectedFaculty('');
      setDialogMessage({ type: 'success', text: 'Faculty deleted successfully!' });
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFacultyClick = (faculty) => {
    window.open(`/${faculty.toLowerCase()}`, '_blank');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Gestión de Facultades
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Agregar Nueva Facultad
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Nombre de la Facultad"
              value={newFacultyName}
              onChange={(e) => setNewFacultyName(e.target.value)}
              error={errors.facultyName}
              helperText={errors.facultyName ? 'El nombre de la facultad es requerido' : ''}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddFaculty}
            >
              Agregar
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Seleccionar Facultad
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Facultad</InputLabel>
            <Select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              label="Facultad"
            >
              {faculties.map((faculty) => (
                <MenuItem key={faculty} value={faculty}>
                  {faculty}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedFaculty && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Configuración de Google Sheets
            </Typography>
            <TextField
              fullWidth
              label="ID de la Hoja de Cálculo"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              error={errors.spreadsheetId}
              helperText={errors.spreadsheetId ? 'El ID de la hoja de cálculo es requerido' : ''}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Clave API"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              error={errors.apiKey}
              helperText={errors.apiKey ? 'La clave API es requerida' : ''}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteFaculty}
              >
                Eliminar Facultad
              </Button>
              <Button
                variant="contained"
                onClick={() => handleFacultyClick(selectedFaculty)}
              >
                Ver Página
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogMessage.type === 'success' ? 'Éxito' : 'Error'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogMessage.text}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyManagement;