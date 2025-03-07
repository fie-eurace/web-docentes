import React from 'react'
import { AppBar, Toolbar, Box, Container, Typography } from '@mui/material'

const Layout = ({ children, showToolbar = true }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      {showToolbar && (
        <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="https://www.espoch.edu.ec/wp-content/uploads/2022/07/cropped-sello-512x512-blanco-1536x501.png"
              alt="ESPOCH Logo"
              style={{ height: '50px', marginRight: '16px' }}
            />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Docentes e Investigadores
            </Typography>
          </Toolbar>
        </AppBar>
      )}
      {/* Add toolbar placeholder to prevent content from hiding under the AppBar */}
      {showToolbar && <Toolbar />}
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        {children}
      </Container>
    </Box>
  )
}

export default Layout