import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Container,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination
} from '@mui/material';
import ProfessorCard from './ProfessorCard';
import { useParams } from 'react-router-dom';
import { fetchProfessorsData } from '../utils/googleSheetsConfig';
import { getFacultyConfig } from '../api/api.config';

const ProfessorList = () => {
  const { faculty } = useParams(); // Obtener la facultad desde la URL
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('Todos');
  const [page, setPage] = useState(1);
  const professorsPerPage = 10;
  const [facultyConfig, setFacultyConfig] = useState(null);

  // Cargar la configuración de la facultad seleccionada
  useEffect(() => {
    const loadFacultyConfig = async () => {
      try {
        setLoading(true);
        setError(null);
    
        console.log("📌 Buscando configuración para la facultad:", faculty);
        const config = await getFacultyConfig(faculty);
        console.log("✅ Configuración obtenida en getFacultyConfig:", config);
    
        if (!config || !config.spreadsheetId || !config.apiKey || !config.selectedSheet?.title) {
          throw new Error(`Configuración incompleta para la facultad: ${faculty}.`);
        }
    
        setFacultyConfig(config);
    
        // Cargar datos de los profesores con el nombre de la facultad, no el ID de la hoja
        const data = await fetchProfessorsData(faculty);
        setProfessors(data);
      } catch (error) {
        console.error("❌ Error al cargar la facultad:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    

    if (faculty) {
        loadFacultyConfig();
    }
  }, [faculty]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCareerChange = (event) => {
    setSelectedCareer(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const careers = ['Todos', ...new Set(professors.map(p => p.carrera))];

  const filteredProfessors = professors.filter(professor => {
    const matchesSearch = `${professor.nombres} ${professor.apellidos}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCareer = selectedCareer === 'Todos' || professor.carrera === selectedCareer;
    return matchesSearch && matchesCareer;
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar profesor"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Carrera</InputLabel>
              <Select
                value={selectedCareer}
                label="Carrera"
                onChange={handleCareerChange}
              >
                {careers.map(career => (
                  <MenuItem key={career} value={career}>
                    {career}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2}>
        {filteredProfessors
          .slice((page - 1) * professorsPerPage, page * professorsPerPage)
          .map((professor, index) => (
            <Grid item xs={12} key={index}>
              <ProfessorCard professor={professor} />
            </Grid>
          ))}
      </Grid>

      <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.ceil(filteredProfessors.length / professorsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="large"
        />
      </Box>

      {filteredProfessors.length === 0 && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">No se encontraron profesores con los criterios de búsqueda actuales.</Alert>
        </Box>
      )}
    </Container>
  );
};

export default ProfessorList;