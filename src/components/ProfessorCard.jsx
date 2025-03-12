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
}

export default ProfessorCard