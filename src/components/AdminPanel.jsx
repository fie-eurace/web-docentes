import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  CssBaseline,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper
} from '@mui/material';
import { School, ViewList, Person, Add, Delete, Refresh, Save } from '@mui/icons-material';
import { loadFacultyConfig, saveFacultyConfig, DEFAULT_FIELD_MAPPINGS } from '../utils/facultyConfig';
import { fetchSheetHeaders, fetchAvailableSheets } from '../utils/googleSheetsConfig';
import FacultyManagement from './admin/FacultyManagement';
import ProfessorListConfig from './admin/ProfessorListConfig';
import ProfessorCardConfig from './admin/ProfessorCardConfig';


const drawerWidth = 200;

const AdminPanel = () => {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [fieldMappings, setFieldMappings] = useState({});
  const [fieldDisplayLocations, setFieldDisplayLocations] = useState({});
  const [currentSection, setCurrentSection] = useState('faculties');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ type: '', text: '' });
  const [newFacultyName, setNewFacultyName] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [errors, setErrors] = useState({
    facultyName: false,
    spreadsheetId: false,
    apiKey: false
  });

  useEffect(() => {
    const loadFaculties = () => {
      const storedFaculties = Object.keys(localStorage)
        .filter(key => key.startsWith('faculty_'))
        .map(key => key.replace('faculty_', ''));
      setFaculties(storedFaculties);
    };
    loadFaculties();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      try {
        const config = loadFacultyConfig(selectedFaculty);
        setSpreadsheetId(config.spreadsheetId || '');
        setApiKey(config.apiKey || '');
        setFieldMappings(config.fieldMappings || {});
        
        // Load display locations for each field
        const displayLocations = {};
        Object.entries(config.fieldMappings || {}).forEach(([key, fieldConfig]) => {
          displayLocations[key] = fieldConfig.displayIn || [];
        });
        setFieldDisplayLocations(displayLocations);
      } catch (error) {
        console.error('Error loading faculty configuration:', error);
      }
    } else {
      setSpreadsheetId('');
      setApiKey('');
      setFieldMappings({});
      setFieldDisplayLocations({});
    }
  }, [selectedFaculty]);

  const validateInputs = () => {
    const newErrors = {
      spreadsheetId: !spreadsheetId.trim(),
      apiKey: !apiKey.trim(),
      facultyName: !selectedFaculty
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

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

  const handleFieldToggle = (field) => {
    setSelectedFields(prev => {
      const newSelectedFields = prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field];
      
      // If adding a new field, initialize its display locations
      if (!prev.includes(field)) {
        const fieldConfig = DEFAULT_FIELD_MAPPINGS[field];
        setFieldDisplayLocations(prev => ({
          ...prev,
          [field]: fieldConfig?.displayIn || []
        }));
      }
      
      return newSelectedFields;
    });
  };
  
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
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLoadSheets = async () => {
    if (!spreadsheetId || !apiKey) {
      setDialogMessage({ type: 'error', text: 'Por favor, ingrese el ID de la hoja de cálculo y la clave API' });
      setOpenDialog(true);
      return;
    }
    
    setLoading(true);
    try {
      const sheets = await fetchAvailableSheets(spreadsheetId, apiKey);
      setAvailableSheets(sheets);
      setDialogMessage({ type: 'success', text: `Se encontraron ${sheets.length} hojas en el documento` });
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching sheets:', error);
      setDialogMessage({
        type: 'error',
        text: 'Error al obtener las hojas del documento: ' + error.message
      });
      setOpenDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = async (event) => {
    const sheetId = event.target.value;
    const selectedSheet = availableSheets.find(sheet => sheet.sheetId === sheetId);
    setSelectedSheet(selectedSheet);
    
    // Clear existing headers when changing sheets
    setSheetHeaders([]);
    setTableData([]);
    
    // Load headers for the selected sheet
    if (selectedSheet) {
      try {
        setLoading(true);
        const headers = await fetchSheetHeaders(spreadsheetId, apiKey, selectedSheet.title);
        setSheetHeaders(headers);
        setDialogMessage({ type: 'success', text: `Se encontraron ${headers.length} columnas en la hoja seleccionada` });
        setOpenDialog(true);
        
        // Fetch preview data (first 10 rows)
        await fetchSheetPreviewData(spreadsheetId, apiKey, selectedSheet.title);
      } catch (error) {
        console.error('Error loading sheet data:', error);
        setDialogMessage({
          type: 'error',
          text: 'Error al cargar los datos de la hoja: ' + error.message
        });
        setOpenDialog(true);
      } finally {
        setLoading(false);
      }
    }
  };
  
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

  // Update handleSaveConfiguration to include selectedSheet
  const handleSaveConfiguration = () => {
    if (!validateInputs()) {
      setDialogMessage({ type: 'error', text: 'Please fill in all required fields' });
      setOpenDialog(true);
      return;
    }
    
    setLoading(true);
    try {
      const config = loadFacultyConfig(selectedFaculty);
      config.spreadsheetId = spreadsheetId;
      config.apiKey = apiKey;
      config.selectedSheet = selectedSheet;
      
      // Create new fieldMappings object with only selected fields and their display locations
      const newFieldMappings = {};
      selectedFields.forEach(field => {
        if (DEFAULT_FIELD_MAPPINGS[field]) {
          newFieldMappings[field] = {
            label: DEFAULT_FIELD_MAPPINGS[field].label,
            displayIn: fieldDisplayLocations[field] || [],
            columnIndex: fieldMappings[field]?.columnIndex
          };
        }
      });
      config.fieldMappings = newFieldMappings;

      if (saveFacultyConfig(selectedFaculty, config)) {
        setDialogMessage({ type: 'success', text: 'Faculty configuration saved successfully!' });
      } else {
        setDialogMessage({ type: 'error', text: 'Failed to save faculty configuration!' });
      }
      setOpenDialog(true);
    } catch (error) {
      console.error('Error saving faculty config:', error);
      setDialogMessage({ type: 'error', text: 'An error occurred while saving faculty configuration' });
      setOpenDialog(true);
    } finally {
      setLoading(false);
    }
  };

  // We no longer need the timeout for messages since we're using a dialog that the user must close

  const handleFacultyClick = (faculty) => {
    window.open(`/${faculty.toLowerCase()}`, '_blank');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Panel de Administración
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton
                selected={currentSection === 'faculties'}
                onClick={() => setCurrentSection('faculties')}
              >
                <ListItemIcon>
                  <School />
                </ListItemIcon>
                <ListItemText primary="Gestión de Facultades" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={currentSection === 'professorList'}
                onClick={() => setCurrentSection('professorList')}
              >
                <ListItemIcon>
                  <ViewList />
                </ListItemIcon>
                <ListItemText primary="Configurar Lista" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={currentSection === 'professorCard'}
                onClick={() => setCurrentSection('professorCard')}
              >
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText primary="Configurar Tarjeta" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />

        {currentSection === 'professorList' && (
          <ProfessorListConfig
            selectedFaculty={selectedFaculty}
            spreadsheetId={spreadsheetId}
            apiKey={apiKey}
            fieldMappings={fieldMappings}
            setFieldMappings={setFieldMappings}
          />
        )}

        {currentSection === 'professorCard' && (
          <ProfessorCardConfig
            selectedFaculty={selectedFaculty}
            fieldMappings={fieldMappings}
            fieldDisplayLocations={fieldDisplayLocations}
            setFieldDisplayLocations={setFieldDisplayLocations}
          />
        )}

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {dialogMessage.type === 'success' ? 'Éxito' : 'Error'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {dialogMessage.text}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Faculty Management Section */}
        {currentSection === 'faculties' && (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Gestión de Facultades
            </Typography>

            {/* Available Faculties Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Facultades Disponibles
                </Typography>
                <Grid container spacing={2}>
                  {faculties.map((faculty) => (
                    <Grid item xs={12} sm={6} md={4} key={faculty}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleFacultyClick(faculty)}
                        sx={{ py: 2 }}
                      >
                        {faculty}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Add New Faculty Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
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
                    onClick={handleAddFaculty}
                    startIcon={<Add />}
                  >
                    Agregar
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Faculty Configuration Card */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurar Facultad Existente
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Seleccionar Facultad</InputLabel>
                    <Select
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      error={errors.facultyName}
                    >
                      {faculties.map((faculty) => (
                        <MenuItem key={faculty} value={faculty}>
                          {faculty}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedFaculty && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDeleteFaculty}
                      startIcon={<Delete />}
                    >
                      Eliminar
                    </Button>
                  )}
                </Box>

                {selectedFaculty && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>
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
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleLoadSheets}
                        startIcon={<Refresh />}
                        disabled={loading || !spreadsheetId || !apiKey}
                      >
                        Cargar Hojas Disponibles
                      </Button>
                    </Box>
                    {availableSheets.length > 0 && (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Seleccionar Hoja</InputLabel>
                        <Select
                          value={selectedSheet ? selectedSheet.sheetId : ''}
                          onChange={handleSheetChange}
                          label="Seleccionar Hoja"
                        >
                          {availableSheets.map((sheet) => (
                            <MenuItem key={sheet.sheetId} value={sheet.sheetId}>
                              {sheet.title}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveConfiguration}
                      startIcon={<Save />}
                      disabled={loading}
                    >
                      Guardar Configuración
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default AdminPanel;