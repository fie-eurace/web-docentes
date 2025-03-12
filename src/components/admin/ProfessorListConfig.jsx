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
import { loadFacultyConfig, saveFacultyConfig } from '../../services/facultyServices';
import { getFacultyConfig, saveFieldMappings } from '../../api/api.config';


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
  const [tablePreview, setTablePreview] = useState([]);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch("http://localhost:4000/faculties");
        if (!response.ok) throw new Error("No se pudieron cargar las facultades");
  
        const faculties = await response.json();
        setAvailableFaculties(faculties.map(f => f.name));
  
        if (!localSelectedFaculty && faculties.length > 0) {
          setLocalSelectedFaculty(faculties[0].name);
        }
      } catch (error) {
        console.error("Error cargando facultades:", error);
      }
    };
  
    fetchFaculties();
  }, []);

  // Load faculty configuration when localSelectedFaculty changes
  useEffect(() => {
    const loadFacultyData = async () => {
      if (!localSelectedFaculty) return;
  
      try {
        setLoading(true);
        const facultyData = await getFacultyConfig(localSelectedFaculty);
        setSelectedSheet(facultyData.selectedSheet || null);
  
        if (facultyData.spreadsheetId && facultyData.apiKey && facultyData.selectedSheet) {
          // Cargar encabezados de la hoja
          const headers = await fetchSheetHeaders(
            facultyData.spreadsheetId,
            facultyData.apiKey,
            facultyData.selectedSheet.title
          );
          setSheetHeaders(headers);
  
          // Cargar datos de vista previa
          await fetchSheetPreviewData(
            facultyData.spreadsheetId,
            facultyData.apiKey,
            facultyData.selectedSheet.title
          );
  
          // Si hay mapeo guardado, aplicarlo
          if (facultyData.fieldMappings.length > 0) {
            const mappings = {};
            facultyData.fieldMappings.forEach(mapping => {
              mappings[mapping.fieldKey] = {
                label: mapping.label,
                columnIndex: mapping.columnIndex,
                displayIn: JSON.parse(mapping.displayIn || "[]")
              };
            });
  
            setFieldMappings(mappings);
          }
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
        setDialogMessage({
          type: "error",
          text: "Error al obtener la configuración de la facultad: " + error.message
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

  // Function to fetch preview data (first 10 rows) from the selected sheet
  const fetchSheetPreviewData = async (spreadsheetId, apiKey, sheetName) => {
    try {
      setLoading(true);
      const range = sheetName ? `${sheetName}!A1:Z11` : 'A1:Z11'; 
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`
      );
  
      if (!response.ok) {
        throw new Error(`Error de servidor (${response.status}). Verifica la configuración de la API.`);
      }
  
      const data = await response.json();
  
      if (!data.values || !Array.isArray(data.values) || data.values.length <= 1) {
        throw new Error('No se encontraron datos en la hoja de cálculo');
      }
  
      // La primera fila son los encabezados, las siguientes son los datos
      const headers = data.values[0];
      const rows = data.values.slice(1);
  
      console.log("✅ Datos cargados correctamente:", rows);
  
      // Guardar los datos sin alterarlos
      setTableData(rows);
  
      // Aplicar mapeo actual sobre los nuevos datos
      updatePreviewData(fieldMappings);
    } catch (error) {
      console.error("Error al obtener vista previa:", error);
      setDialogMessage({
        type: 'error',
        text: 'Error al obtener los datos de la vista previa: ' + error.message
      });
      setOpenDialog(true);
    } finally {
      setLoading(false);
    }
  };
  

  const updatePreviewData = (updatedFieldMappings) => {
    if (!tableData || tableData.length === 0) {
      console.warn("No hay datos en la tabla para actualizar la vista previa.");
      return [];
    }
  
    // Mapear datos en tiempo real según las columnas seleccionadas
    return tableData.slice(0, 3).map(row => ({
      nombres: row[updatedFieldMappings.nombres?.columnIndex] || 'N/A',
      apellidos: row[updatedFieldMappings.apellidos?.columnIndex] || 'N/A',
      carrera: row[updatedFieldMappings.carrera?.columnIndex] || 'N/A',
      email: row[updatedFieldMappings.email?.columnIndex] || '',
      url_imagen: row[updatedFieldMappings.url_imagen?.columnIndex] || '',
      relacion_laboral: row[updatedFieldMappings.relacion_laboral?.columnIndex] || 'N/A'
    }));
  };
  
  
  const handleColumnMappingChange = (field, columnIndex) => {
    setFieldMappings(prev => {
      const updatedMappings = {
        ...prev,
        [field]: {
          ...prev[field],
          columnIndex
        }
      };
  
      // Calcular nueva vista previa con los datos cargados
      setTablePreview(updatePreviewData(updatedMappings));
  
      return updatedMappings;
    });
  };
  

  const handleSaveColumnMappings = async () => {
    if (!localSelectedFaculty) {
      setDialogMessage({ type: 'error', text: 'Por favor, seleccione una facultad primero' });
      setOpenDialog(true);
      return;
    }
  
    setLoading(true);
    try {
      const facultyData = await getFacultyConfig(localSelectedFaculty);
  
      const fieldMappingsToSave = Object.entries(fieldMappings).map(([key, value]) => ({
        fieldKey: key,
        label: value.label || key,
        columnIndex: value.columnIndex,
        displayIn: JSON.stringify(value.displayIn || [])
      }));
  
      await saveFieldMappings(facultyData.id, fieldMappingsToSave);
  
      setDialogMessage({ type: 'success', text: 'Mapeo de columnas guardado exitosamente' });
      setOpenDialog(true);
    } catch (error) {
      console.error('Error al guardar el mapeo:', error);
      setDialogMessage({ type: 'error', text: 'Ocurrió un error al guardar el mapeo: ' + error.message });
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