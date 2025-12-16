const fs = require('fs');
const path = require('path');

// Rutas
const versionPath = path.join(__dirname, '../frontend/src/version.json');
const swPath = path.join(__dirname, '../frontend/public/sw.js');

try {
  // Leer el archivo de versión actual
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  
  // Incrementar el número de build
  versionData.build = (parseInt(versionData.build) + 1).toString();
  
  // Actualizar la fecha
  versionData.date = new Date().toISOString();
  
  // Guardar el archivo actualizado
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');
  
  // Copiar version.json a public para que sea accesible en producción
  const publicVersionPath = path.join(__dirname, '../frontend/public/version.json');
  fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2) + '\n');
  
  // Actualizar versión en Service Worker
  try {
    let swContent = fs.readFileSync(swPath, 'utf8');
    const newVersion = `${versionData.version}.${versionData.build}`;
    swContent = swContent.replace(
      /const CACHE_VERSION = '[^']+'/,
      `const CACHE_VERSION = '${newVersion}'`
    );
    fs.writeFileSync(swPath, swContent);
    console.log(`✓ Service Worker actualizado: ${newVersion}`);
  } catch (swError) {
    console.warn('⚠ No se pudo actualizar Service Worker:', swError.message);
  }
  
  console.log(`✓ Versión actualizada: ${versionData.version} (build ${versionData.build})`);
  process.exit(0);
} catch (error) {
  console.error('Error al actualizar versión:', error.message);
  process.exit(1);
}
