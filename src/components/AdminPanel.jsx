import React, { useState } from 'react';
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
} from '@mui/material';
import { School, ViewList, Person } from '@mui/icons-material';
import FacultyManagement from './admin/FacultyManagement';
import ProfessorListConfig from './admin/ProfessorListConfig';
import ProfessorCardConfig from './admin/ProfessorCardConfig';

const drawerWidth = 200;

const AdminPanel = () => {
  const [currentSection, setCurrentSection] = useState('faculties');
  const [fieldMappings, setFieldMappings] = useState({}); // Agregar este estado

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap>
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
        <List>
          <ListItem disablePadding>
            <ListItemButton selected={currentSection === 'faculties'} onClick={() => setCurrentSection('faculties')}>
              <ListItemIcon><School /></ListItemIcon>
              <ListItemText primary="Gestión de Facultades" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={currentSection === 'professorList'} onClick={() => setCurrentSection('professorList')}>
              <ListItemIcon><ViewList /></ListItemIcon>
              <ListItemText primary="Configurar Lista" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={currentSection === 'professorCard'} onClick={() => setCurrentSection('professorCard')}>
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary="Configurar Tarjeta" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />

        {currentSection === 'faculties' && <FacultyManagement />}
        {currentSection === 'professorList' && (
          <ProfessorListConfig fieldMappings={fieldMappings} setFieldMappings={setFieldMappings} /> // 🔥 Pasar el estado como prop
        )}
        {currentSection === 'professorCard' && <ProfessorCardConfig />}
      </Box>
    </Box>
  );
};

export default AdminPanel;
