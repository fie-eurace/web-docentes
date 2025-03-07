// FIE Faculty Configuration
export const FIE_CONFIG = {
  name: 'FIE',
  spreadsheetId: '1Z9yWM5Oa_Anjl3nazAvOsbADS0KgvYMsJwsxRYEXEwo',
  apiKey: 'AIzaSyBVxQnlZoGQGPrqwk-BXhYvZxvPqQGHGBU',
  selectedSheet: {
    title: 'Sheet1', // Changed from 'FIE' to 'Sheet1' as this is likely the actual sheet name
    sheetId: '0'
  },
  fieldMappings: {
    cedula: { label: 'ID', displayIn: ['card', 'detail'], columnIndex: 0 },
    nombres: { label: 'First Name', displayIn: ['card', 'detail'], columnIndex: 1 },
    apellidos: { label: 'Last Name', displayIn: ['card', 'detail'], columnIndex: 2 },
    email: { label: 'Email', displayIn: ['card', 'detail'], columnIndex: 3 },
    relacion_laboral: { label: 'Employment Relationship', displayIn: ['detail'], columnIndex: 4 },
    titulo_phd: { label: 'PhD Title', displayIn: ['card', 'detail'], columnIndex: 5 },
    dedicacion: { label: 'Dedication', displayIn: ['detail'], columnIndex: 6 },
    carrera: { label: 'Career', displayIn: ['card', 'detail'], columnIndex: 7 },
    ima_correo: { label: 'Email Image', displayIn: ['card', 'detail'], columnIndex: 8 },
    ima_pdf: { label: 'CV PDF', displayIn: ['card', 'detail'], columnIndex: 9 },
    ima_iresearch: { label: 'Research Profile', displayIn: ['card', 'detail'], columnIndex: 10 },
    presentacion: { label: 'Presentation', displayIn: ['detail'], columnIndex: 11 },
    docencia: { label: 'Teaching', displayIn: ['detail'], columnIndex: 12 },
    url_imagen: { label: 'Profile Image', displayIn: ['card', 'detail'], columnIndex: 13 },
    publicaciones: { label: 'Publications', displayIn: ['detail'], columnIndex: 14 },
    grupo_investigacion: { label: 'Research Group', displayIn: ['detail'], columnIndex: 15 }
  },
  logo: 'https://fie.espoch.edu.ec/web/image/website/1/logo/FIE?unique=b08d34e',
  primaryColor: '#234e94'
};