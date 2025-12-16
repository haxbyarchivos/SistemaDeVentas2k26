const fs = require('fs');
const path = require('path');

// Ruta al archivo de versión
const versionPath = path.join(__dirname, '../frontend/src/version.json');

try {
  // Leer el archivo de versión actual
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  
  // Incrementar el número de build
  versionData.build = (parseInt(versionData.build) + 1).toString();
  
  // Actualizar la fecha
  versionData.date = new Date().toISOString();
  
  // Guardar el archivo actualizado
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');
  
  console.log(`✓ Versión actualizada: ${versionData.version} (build ${versionData.build})`);
  process.exit(0);
} catch (error) {
  console.error('Error al actualizar versión:', error.message);
  process.exit(1);
}
