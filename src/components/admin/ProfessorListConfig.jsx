import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Avatar,
  IconButton,
  Link
} from '@mui/material';
import { Refresh, Save, Email } from '@mui/icons-material';
import { fetchSheetHeaders, fetchAvailableSheets } from '../../utils/googleSheetsConfig';
import { loadFacultyConfig, saveFacultyConfig } from '../../utils/facultyConfig';

const ProfessorListConfig = ({
  selectedFaculty,
  spreadsheetId,
  apiKey,
  fieldMappings,
  setFieldMappings
}) => {
  const [loading, setLoading] = useState(false);
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ type: '', text: '' });
  const [localSelectedFaculty, setLocalSelectedFaculty] = useState('');
  const [availableFaculties, setAvailableFaculties] = useState([]);

  useEffect(() => {
    // Load available faculties from localStorage
    const loadFaculties = () => {
      const storedFaculties = Object.keys(localStorage)
        .filter(key => key.startsWith('faculty_'))
        .map(key => key.replace('faculty_', ''));
      setAvailableFaculties(storedFaculties);

      // If no faculty is selected but we have faculties available, select the first one
      if (!localSelectedFaculty && storedFaculties.length > 0) {
        setLocalSelectedFaculty(storedFaculties[0]);
      }
    };
    
    // Add event listener for storage changes
    window.addEventListener('storage', loadFaculties);
    loadFaculties();
    
    return () => {
      window.removeEventListener('storage', loadFaculties);
    };
  }, [localSelectedFaculty]);

  // Load faculty configuration when localSelectedFaculty changes
  useEffect(() => {
    const loadFacultyData = async () => {
      if (!localSelectedFaculty) return;

      try {
        setLoading(true);
        const config = loadFacultyConfig(localSelectedFaculty);
        
        // Load the field mappings from the faculty config
        if (config.fieldMappings) {
          setFieldMappings(config.fieldMappings);
        }

        // Load the selected sheet from the config
        if (config.selectedSheet) {
          setSelectedSheet(config.selectedSheet);
        }
        
        if (config.spreadsheetId && config.apiKey && config.selectedSheet) {
          // Fetch headers for the selected sheet
          const headers = await fetchSheetHeaders(config.spreadsheetId, config.apiKey, config.selectedSheet.title);
          setSheetHeaders(headers);
          
          // Fetch preview data
          await fetchSheetPreviewData(config.spreadsheetId, config.apiKey, config.selectedSheet.title);
        }
      } catch (error) {
        console.error('Error loading faculty data:', error);
        setDialogMessage({
          type: 'error',
          text: 'Error al cargar los datos de la facultad: ' + error.message
        });
        setOpenDialog(true);
      } finally {
        setLoading(false);
      }
    };

    loadFacultyData();
  }, [localSelectedFaculty]);

  useEffect(() => {
    if (localSelectedFaculty) {
      const config = loadFacultyConfig(localSelectedFaculty);
      
      // Load spreadsheetId and apiKey from the selected faculty's config
      const facultySpreadsheetId = config.spreadsheetId;
      const facultyApiKey = config.apiKey;
      
      // Load the field mappings from the faculty config
      if (config.fieldMappings) {
        setFieldMappings(config.fieldMappings);
      }

      // Load the selected sheet from the config
      if (config.selectedSheet) {
        setSelectedSheet(config.selectedSheet);
      }
      
      if (facultySpreadsheetId && facultyApiKey && config.selectedSheet) {
        setLoading(true);
        // Fetch headers for the selected sheet
        fetchSheetHeaders(facultySpreadsheetId, facultyApiKey, config.selectedSheet.title)
          .then(headers => {
            setSheetHeaders(headers);
            // Fetch preview data
            return fetchSheetPreviewData(facultySpreadsheetId, facultyApiKey, config.selectedSheet.title);
          })
          .catch(error => {
            console.error('Error fetching sheet data:', error);
            setDialogMessage({
              type: 'error',
              text: 'Error al cargar los datos de la hoja: ' + error.message
            });
            setOpenDialog(true);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [localSelectedFaculty]);

  // Sheet selection functionality has been moved to FacultyManagement


  // Function to fetch preview data (first 10 rows) from the selected sheet
  const fetchSheetPreviewData = async (spreadsheetId, apiKey, sheetName) => {
    try {
      setLoading(true);
      // Use the sheet name in the request if provided
      const range = sheetName ? `${sheetName}!A1:Z11` : 'A1:Z11'; // Get header + 10 rows
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Error de servidor (${response.status}). Por favor, verifique la configuración de la API de Google Sheets.`);
      }
      
      const data = await response.json();
      
      if (!data.values || !Array.isArray(data.values) || data.values.length <= 1) {
        throw new Error('No se encontraron datos en la hoja de cálculo');
      }
      
      // First row is headers, rest are data rows
      const headers = data.values[0];
      const rows = data.values.slice(1);
      
      setTableData(rows);
    } catch (error) {
      console.error('Error fetching preview data:', error);
      setDialogMessage({
        type: 'error',
        text: 'Error al obtener los datos de vista previa: ' + error.message
      });
      setOpenDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMappingChange = (field, columnIndex) => {
    setFieldMappings(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        columnIndex
      }
    }));
  };

  const handleSaveColumnMappings = () => {
    if (!localSelectedFaculty) {
      setDialogMessage({ type: 'error', text: 'Por favor, seleccione una facultad primero' });
      setOpenDialog(true);
      return;
    }
    
    setLoading(true);
    try {
      const config = loadFacultyConfig(localSelectedFaculty);
      
      // Update field mappings with column indices
      const updatedFieldMappings = {};
      Object.entries(fieldMappings).forEach(([field, fieldConfig]) => {
        if (config.fieldMappings[field]) {
          updatedFieldMappings[field] = {
            ...config.fieldMappings[field],
            columnIndex: fieldConfig.columnIndex
          };
        }
      });
      
      config.fieldMappings = updatedFieldMappings;
      
      // Make sure we save the selected sheet information
      if (selectedSheet) {
        config.selectedSheet = selectedSheet;
      }
      
      if (saveFacultyConfig(localSelectedFaculty, config)) {
        setDialogMessage({ 
          type: 'success', 
          text: 'Mapeo de columnas guardado exitosamente. Ahora puede ver la lista de profesores con la configuración actualizada.' 
        });
        setOpenDialog(true);
      } else {
        setDialogMessage({ type: 'error', text: 'Error al guardar el mapeo de columnas' });
        setOpenDialog(true);
      }
    } catch (error) {
      console.error('Error saving column mappings:', error);
      setDialogMessage({ type: 'error', text: 'Ocurrió un error al guardar el mapeo de columnas: ' + error.message });
      setOpenDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  if (!localSelectedFaculty) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configuración de Lista de Profesores
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Seleccionar Facultad
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Facultad</InputLabel>
              <Select
                value={localSelectedFaculty}
                onChange={(e) => setLocalSelectedFaculty(e.target.value)}
                label="Facultad"
              >
                {availableFaculties.map((faculty) => (
                  <MenuItem key={faculty} value={faculty}>
                    {faculty}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Alert severity="info">Por favor, seleccione una facultad para comenzar la configuración.</Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Lista de Profesores
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Left side - Configuration */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Seleccionar Facultad
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Facultad</InputLabel>
                <Select
                  value={localSelectedFaculty}
                  onChange={(e) => setLocalSelectedFaculty(e.target.value)}
                  label="Facultad"
                >
                  {availableFaculties.map((faculty) => (
                    <MenuItem key={faculty} value={faculty}>
                      {faculty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Mapeo de Columnas para la Hoja Seleccionada
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                La hoja de cálculo se configura en la sección de Gestión de Facultades.
                {selectedSheet && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Hoja actual: <strong>{selectedSheet.title}</strong>
                  </Typography>
                )}
              </Alert>
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {sheetHeaders.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Mapeo de Columnas
                </Typography>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Nombre
                  </Typography>
                  <FormControl fullWidth size="small" variant="outlined">
                    <Select
                      value={fieldMappings.nombres?.columnIndex !== undefined ? fieldMappings.nombres.columnIndex : ''}
                      onChange={(e) => handleColumnMappingChange('nombres', e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">No seleccionado</MenuItem>
                      {sheetHeaders.map((header) => (
                        <MenuItem key={header.index} value={header.index}>
                          {header.name} (Columna {header.index + 1})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Apellidos
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={fieldMappings.apellidos?.columnIndex !== undefined ? fieldMappings.apellidos.columnIndex : ''}
                      onChange={(e) => handleColumnMappingChange('apellidos', e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">No seleccionado</MenuItem>
                      {sheetHeaders.map((header) => (
                        <MenuItem key={header.index} value={header.index}>
                          {header.name} (Columna {header.index + 1})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Carrera
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={fieldMappings.carrera?.columnIndex !== undefined ? fieldMappings.carrera.columnIndex : ''}
                      onChange={(e) => handleColumnMappingChange('carrera', e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">No seleccionado</MenuItem>
                      {sheetHeaders.map((header) => (
                        <MenuItem key={header.index} value={header.index}>
                          {header.name} (Columna {header.index + 1})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Email
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={fieldMappings.email?.columnIndex !== undefined ? fieldMappings.email.columnIndex : ''}
                      onChange={(e) => handleColumnMappingChange('email', e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">No seleccionado</MenuItem>
                      {sheetHeaders.map((header) => (
                        <MenuItem key={header.index} value={header.index}>
                          {header.name} (Columna {header.index + 1})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Foto URL
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={fieldMappings.url_imagen?.columnIndex !== undefined ? fieldMappings.url_imagen.columnIndex : ''}
                      onChange={(e) => handleColumnMappingChange('url_imagen', e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">No seleccionado</MenuItem>
                      {sheetHeaders.map((header) => (
                        <MenuItem key={header.index} value={header.index}>
                          {header.name} (Columna {header.index + 1})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cargo
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={fieldMappings.relacion_laboral?.columnIndex !== undefined ? fieldMappings.relacion_laboral.columnIndex : ''}
                      onChange={(e) => handleColumnMappingChange('relacion_laboral', e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">No seleccionado</MenuItem>
                      {sheetHeaders.map((header) => (
                        <MenuItem key={header.index} value={header.index}>
                          {header.name} (Columna {header.index + 1})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveColumnMappings}
                    disabled={loading}
                  >
                    Guardar Mapeo
                  </Button>
                  {localSelectedFaculty && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => window.open(`/${localSelectedFaculty.toLowerCase()}`, '_blank')}
                      disabled={loading}
                    >
                      Ver Lista de Profesores
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right side - Preview */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Typography variant="subtitle1" gutterBottom>
              Vista Previa de Tarjetas
            </Typography>
            {tableData.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {tableData.slice(0, 3).map((row, rowIndex) => {
                  const professor = {
                    nombres: row[fieldMappings.nombres?.columnIndex] || '',
                    apellidos: row[fieldMappings.apellidos?.columnIndex] || '',
                    carrera: row[fieldMappings.carrera?.columnIndex] || '',
                    email: row[fieldMappings.email?.columnIndex] || '',
                    url_imagen: row[fieldMappings.url_imagen?.columnIndex] || '',
                    relacion_laboral: row[fieldMappings.relacion_laboral?.columnIndex] || ''
                  };

                  return (
                    <Paper 
                      key={rowIndex}
                      elevation={1} 
                      sx={{
                        p: 1.5,
                        mb: 1.5,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          elevation: 3,
                          bgcolor: 'action.hover',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Avatar
                            sx={{
                              width: { xs: 80, sm: 100 },
                              height: { xs: 80, sm: 100 },
                              fontSize: { xs: '1.8rem', sm: '2rem' },
                              margin: 'auto'
                            }}
                            src={professor.url_imagen}
                          >
                            {professor.nombres ? professor.nombres[0] : '?'}
                          </Avatar>
                        </Grid>
                        <Grid item xs={12} sm={9}>
                          <Typography variant="h6" gutterBottom>
                            {`${professor.nombres} ${professor.apellidos}`}
                          </Typography>
                          <Typography variant="body1" color="textSecondary" gutterBottom>
                            {professor.carrera}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            {professor.relacion_laboral}
                          </Typography>
                          
                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {professor.email && (
                              <>
                                <Typography variant="body2" color="primary" component={Link} href={`mailto:${professor.email}`} sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                  {professor.email}
                                </Typography>
                                <IconButton
                                  component={Link}
                                  href={`mailto:${professor.email}`}
                                  color="primary"
                                  aria-label="email"
                                  size="small"
                                >
                                  <Email fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Configure los campos y guarde el mapeo para ver la vista previa.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

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

export default ProfessorListConfig;