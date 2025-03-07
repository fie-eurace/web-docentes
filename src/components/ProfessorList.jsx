import React, { useState, useEffect } from 'react'
import {
  Box,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  Avatar,
  Tabs,
  Tab,
  Container,
  Grid,
  Link,
  IconButton,
  Pagination
} from '@mui/material'
import { Email, PictureAsPdf, Science } from '@mui/icons-material'
import { fetchProfessorsData } from '../utils/googleSheetsConfig'
import { TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material'
import ProfessorCard from './ProfessorCard'
import { useParams } from 'react-router-dom'

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

const ProfessorList = () => {
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCareer, setSelectedCareer] = useState('Todos')
  const [page, setPage] = useState(1)
  const professorsPerPage = 10
  const { faculty, professorName, career } = useParams()

  useEffect(() => {
    const loadProfessors = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchProfessorsData(faculty || 'FIE')
        setProfessors(data)
      } catch (error) {
        console.error('Error loading professors:', error)
        setError('Error al cargar los datos de profesores. Por favor, intente nuevamente más tarde.')
      } finally {
        setLoading(false)
      }
    }

    loadProfessors()
  }, [faculty])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
  }

  const handleCareerChange = (event) => {
    setSelectedCareer(event.target.value)
    setPage(1) // Reset to first page when changing career
  }

  const handlePageChange = (event, value) => {
    setPage(value)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  const careers = ['Todos', ...new Set(professors.map(p => p.carrera))]

  const filteredProfessors = professors.filter(professor => {
    const matchesSearch = `${professor.nombres} ${professor.apellidos} ${professor.titulo_phd || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCareer = selectedCareer === 'Todos' || professor.carrera === selectedCareer
    return matchesSearch && matchesCareer
  })

  const selectedProfessor = professorName
    ? professors.find(p => {
        const fullName = `${p.nombres}-${p.apellidos}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
        const careerPath = p.carrera
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
        return fullName === professorName && careerPath === career
      })
    : null

  if (selectedProfessor) {
    return (
      <Container maxWidth="lg">
        <ProfessorCard professor={selectedProfessor} detailed />
      </Container>
    )
  }

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
  )
}

export default ProfessorList