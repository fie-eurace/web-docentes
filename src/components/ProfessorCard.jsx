import React, { useState } from 'react'
import {
  Paper,
  Typography,
  Avatar,
  Box,
  IconButton,
  Link,
  Grid,
  Container,
  Divider,
  Chip,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material'
import { Email, PictureAsPdf, Science, School, Work, ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const TabPanel = (props) => {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

const ProfessorCard = ({ professor, detailed = false }) => {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleClick = () => {
    if (!detailed) {
      const careerPath = professor.carrera
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim() // Remove leading/trailing spaces

      const professorPath = `${professor.nombres}-${professor.apellidos}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim() // Remove leading/trailing spaces

      // Get the faculty ID from the current URL or use default 'FIE'
      const facultyId = window.location.pathname.split('/')[1] || 'fie'

      // Open in a new tab with faculty ID in the path
      window.open(`/${facultyId}/${careerPath}/${professorPath}`, '_blank')
    }
  }

  // For non-detailed view (list view)
  if (!detailed) {
    return (
      <Paper 
        elevation={1} 
        sx={{
          p: 1.5,
          mb: 1.5,
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            elevation: 3,
            bgcolor: 'action.hover',
            transform: 'translateY(-2px)'
          }
        }}
        onClick={handleClick}
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
    )
  }

  // For detailed view
  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 3 }}>
        <IconButton
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
          aria-label="back to list"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Curriculum Vitae
        </Typography>
      </Box>
      <Grid container spacing={4}>
        {/* Left Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box
                component="img"
                src={professor.url_imagen || professor.ima_correo || "https://fie.espoch.edu.ec/web/image/website/1/logo/FIE?unique=b08d34e"}
                alt={`${professor.nombres} ${professor.apellidos}`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://fie.espoch.edu.ec/web/image/website/1/logo/FIE?unique=b08d34e";
                }}
                sx={{
                  width: 200,
                  height: 200,
                  objectFit: 'cover',
                  mb: 2
                }}
              />
              <Typography variant="h5" align="center" gutterBottom>
                {`${professor.nombres} ${professor.apellidos}`}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" align="center">
                {professor.titulo_phd || 'No disponible'}
              </Typography>
            </Box>

            {/* Metrics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">4</Typography>
                  <Typography variant="caption">QUINQUENIOS</Typography>
                  <Typography variant="caption" display="block">2021</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">5</Typography>
                  <Typography variant="caption">DOCENCIA</Typography>
                  <Typography variant="caption" display="block">2022-23</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">4</Typography>
                  <Typography variant="caption">SEXENIOS</Typography>
                  <Typography variant="caption" display="block">2021</Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Professor Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Centro</Typography>
              <Typography variant="body2" paragraph>
                Esc. Tec. Sup. de Ingeniería Informática
              </Typography>

              <Typography variant="h6" gutterBottom>Departamento</Typography>
              <Typography variant="body2" paragraph>
                Informática y Estadística
              </Typography>

              <Typography variant="h6" gutterBottom>Área</Typography>
              <Typography variant="body2" paragraph>
                Ciencia de la Comp. e Inteligencia Artificial
              </Typography>

              <Typography variant="h6" gutterBottom>Grupo de investigación</Typography>
              <Typography variant="body2" paragraph>
                {professor.grupo_investigacion || 'No disponible'}
              </Typography>

              <Typography variant="h6" gutterBottom>Centro/Instituto de investigación</Typography>
              <Typography variant="body2" paragraph>
                Centro de Investigación para las Tecnologías Inteligentes de la Información y sus Aplicaciones
              </Typography>

              <Typography variant="h6" gutterBottom>Contacto</Typography>
              <Typography variant="body2">
                {professor.email}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              {professor.email && (
                <IconButton
                  component={Link}
                  href={`mailto:${professor.email}`}
                  color="primary"
                  aria-label="email"
                >
                  <Email />
                </IconButton>
              )}
              {professor.ima_pdf && (
                <IconButton
                  component={Link}
                  href={professor.ima_pdf}
                  target="_blank"
                  color="primary"
                  aria-label="curriculum"
                >
                  <PictureAsPdf />
                </IconButton>
              )}
              {professor.ima_iresearch && (
                <IconButton
                  component={Link}
                  href={professor.ima_iresearch}
                  target="_blank"
                  color="primary"
                  aria-label="research"
                >
                  <Science />
                </IconButton>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="professor tabs" sx={{ mb: 2 }}>
              <Tab label="Presentación" />
              <Tab label="Docencia" />
              <Tab label="Publicaciones" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>Presentación</Typography>
              <Typography variant="body1" paragraph>
                {professor.presentacion || 'No hay información de presentación disponible.'}
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>Docencia</Typography>
              <Typography variant="body1" paragraph>
                {professor.docencia || 'No hay información de docencia disponible.'}
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>Publicaciones</Typography>
              <Typography variant="body1" paragraph>
                {professor.publicaciones || 'No hay publicaciones disponibles.'}
              </Typography>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ProfessorCard