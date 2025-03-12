import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProfessorsData } from '../utils/googleSheetsConfig';
import {
  Paper, Typography, Avatar, Box, IconButton, Link, Grid, Container, Tabs, Tab, CircularProgress, Alert
} from '@mui/material';
import { Email, PictureAsPdf, Science, ArrowBack } from '@mui/icons-material';

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ProfessorDetails = () => {
  const { faculty, professorName } = useParams();
  console.log("📌 Parámetros obtenidos de la URL:", { faculty, professorName });
  const navigate = useNavigate();
  const [professorData, setProfessorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const loadProfessorData = async () => {
      try {
        setLoading(true);
        setError(null);
  
        console.log(`📌 Buscando datos para la facultad: ${faculty}`);
        console.log(`📌 Buscando profesor con nombre: ${professorName}`);
  
        const professors = await fetchProfessorsData(faculty);
        console.log("📋 Lista de profesores obtenida:", professors);
  
        const formattedProfessor = professorName ? professorName.toLowerCase() : "";
        
        const foundProfessor = professors.find(p => {
            if (!p.nombres || !p.apellidos) {
              console.warn("⚠ Profesor sin nombres o apellidos:", p);
              return false;
            }
          
            const generatedPath = `${p.nombres}-${p.apellidos}`
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim();
          
            console.log(`🔗 Comparando: ${generatedPath} === ${formattedProfessor}`);
            return generatedPath === formattedProfessor;
          });
  
        if (!foundProfessor) {
          throw new Error("Profesor no encontrado");
        }
  
        setProfessorData(foundProfessor);
      } catch (error) {
        console.error("❌ Error al cargar el profesor:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    loadProfessorData();
  }, [faculty, professorName]);
  
  

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 3 }}>
        <IconButton onClick={() => navigate(`/${faculty}`)} sx={{ mr: 2 }} aria-label="back">
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" gutterBottom>Curriculum Vitae</Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Columna izquierda */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 120, height: 120, mb: 2 }} src={professorData.url_imagen}>
                {professorData.nombres[0]}
              </Avatar>
              <Typography variant="h5" align="center">{`${professorData.nombres} ${professorData.apellidos}`}</Typography>
              <Typography variant="subtitle1" color="textSecondary" align="center">{professorData.titulo_phd || 'No disponible'}</Typography>
            </Box>

            {/* Información de contacto */}
            {professorData.email && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Link href={`mailto:${professorData.email}`} sx={{ textDecoration: 'none', color: 'primary.main' }}>
                  {professorData.email}
                </Link>
                <IconButton component={Link} href={`mailto:${professorData.email}`} color="primary">
                  <Email />
                </IconButton>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              {professorData.ima_pdf && (
                <IconButton component={Link} href={professorData.ima_pdf} target="_blank" color="primary">
                  <PictureAsPdf />
                </IconButton>
              )}
              {professorData.ima_iresearch && (
                <IconButton component={Link} href={professorData.ima_iresearch} target="_blank" color="primary">
                  <Science />
                </IconButton>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Columna derecha */}
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} aria-label="professor tabs" sx={{ mb: 2 }}>
              <Tab label="Presentación" />
              <Tab label="Docencia" />
              <Tab label="Publicaciones" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6">Presentación</Typography>
              <Typography variant="body1">{professorData.presentacion || 'No disponible'}</Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6">Docencia</Typography>
              <Typography variant="body1">{professorData.docencia || 'No disponible'}</Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6">Publicaciones</Typography>
              <Typography variant="body1">{professorData.publicaciones || 'No disponible'}</Typography>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfessorDetails;
