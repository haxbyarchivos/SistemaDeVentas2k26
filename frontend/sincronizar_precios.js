import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbycplwcdhdzmjxyqqqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieWNwbHdjZGhkem1qeHlxcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MTQyOTEsImV4cCI6MjA0ODk5MDI5MX0.Dg8A5BBNyL0ee-kKHEuhRn7Wb0MmXUaA8mzv3pOZ2vo';
const supabase = createClient(supabaseUrl, supabaseKey);

const LISTA_GENERAL_ID = '12989162-fdb2-4532-a893-5107b4c1cffb';

async function sincronizarPrecios() {
  try {
    console.log('Obteniendo precios de la lista GENERAL...');
    const { data: preciosGenerales, error: errorPrecios } = await supabase
      .from('precios_producto')
      .select('producto_id, precio_usd_kg')
      .eq('lista_precio_id', LISTA_GENERAL_ID);

    if (errorPrecios) throw errorPrecios;
    console.log(`Encontrados ${preciosGenerales.length} precios en la lista GENERAL`);

    console.log('Obteniendo todas las listas de precios...');
    const { data: listas, error: errorListas } = await supabase
      .from('listas_precios')
      .select('id, nombre')
      .neq('id', LISTA_GENERAL_ID);

    if (errorListas) throw errorListas;
    console.log(`Encontradas ${listas.length} listas para sincronizar`);

    for (const lista of listas) {
      console.log(`\nSincronizando lista: ${lista.nombre}`);
      
      for (const precio of preciosGenerales) {
        const { error } = await supabase
          .from('precios_producto')
          .upsert({
            producto_id: precio.producto_id,
            lista_precio_id: lista.id,
            precio_usd_kg: precio.precio_usd_kg,
            activo: true
          }, {
            onConflict: 'producto_id,lista_precio_id'
          });

        if (error) {
          console.error(`Error en producto ${precio.producto_id}:`, error.message);
        }
      }
      
      console.log(`✓ Lista '${lista.nombre}' sincronizada con ${preciosGenerales.length} precios`);
    }

    console.log('\n✓ Sincronización completada exitosamente');
    console.log('Puedes eliminar este archivo ahora.');
  } catch (err) {
    console.error('Error completo:', err);
    console.error('Mensaje:', err.message);
  }
}

sincronizarPrecios();
