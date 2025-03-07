import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  Checkbox,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { loadFacultyConfig, saveFacultyConfig, DISPLAY_LOCATIONS } from '../../utils/facultyConfig';

const ProfessorCardConfig = ({
  selectedFaculty,
  fieldMappings,
  fieldDisplayLocations,
  setFieldDisplayLocations
}) => {
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ type: '', text: '' });

  const handleDisplayLocationToggle = (field, location) => {
    setFieldDisplayLocations(prev => {
      const currentLocations = prev[field] || [];
      const newLocations = currentLocations.includes(location)
        ? currentLocations.filter(loc => loc !== location)
        : [...currentLocations, location];
      
      return {
        ...prev,
        [field]: newLocations
      };
    });
  };

  const handleSaveDisplayLocations = () => {
    if (!selectedFaculty) return;
    
    setLoading(true);
    try {
      const config = loadFacultyConfig(selectedFaculty);
      
      // Update display locations for each field
      Object.entries(fieldDisplayLocations).forEach(([field, locations]) => {
        if (config.fieldMappings[field]) {
          config.fieldMappings[field].displayIn = locations;
        }
      });
      
      if (saveFacultyConfig(selectedFaculty, config)) {
        setDialogMessage({ type: 'success', text: 'Display locations saved successfully!' });
        setOpenDialog(true);
      } else {
        setDialogMessage({ type: 'error', text: 'Failed to save display locations!' });
        setOpenDialog(true);
      }
    } catch (error) {
      console.error('Error saving display locations:', error);
      setDialogMessage({ type: 'error', text: 'An error occurred while saving display locations' });
      setOpenDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  if (!selectedFaculty) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configuración de Tarjeta de Profesor
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Alert severity="info">Por favor, seleccione una facultad para comenzar la configuración.</Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Tarjeta de Profesor
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Configurar Campos Visibles
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Seleccione dónde debe aparecer cada campo en la interfaz de usuario.
        </Typography>

        <Grid container spacing={3}>
          {Object.entries(fieldMappings).map(([field, config]) => (
            <Grid item xs={12} md={6} key={field}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {config.label || field}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {DISPLAY_LOCATIONS.map((location) => (
                    <Chip
                      key={location.value}
                      label={location.label}
                      onClick={() => handleDisplayLocationToggle(field, location.value)}
                      color={fieldDisplayLocations[field]?.includes(location.value) ? 'primary' : 'default'}
                      variant={fieldDisplayLocations[field]?.includes(location.value) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveDisplayLocations}
            disabled={loading}
          >
            Guardar Configuración
          </Button>
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>
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

export default ProfessorCardConfig;