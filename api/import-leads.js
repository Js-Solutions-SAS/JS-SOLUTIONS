const fs = require('node:fs');
const path = require('node:path');
const pg = require('pg');

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getOsmUrl(lead) {
  if (lead.osmType && lead.osmId) {
    return `https://www.openstreetmap.org/${lead.osmType}/${lead.osmId}`;
  }
  if (lead.lat && lead.lon) {
    return `https://www.openstreetmap.org/?mlat=${lead.lat}&mlon=${lead.lon}#map=18/${lead.lat}/${lead.lon}`;
  }
  return '';
}

async function run() {
  console.log("Iniciando importación de leads a la base de datos PostgreSQL...");

  // 1. Leer .env de api
  const envContent = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (!dbUrlMatch) {
    console.error("No se encontró DATABASE_URL en .env");
    process.exit(1);
  }
  const dbUrl = dbUrlMatch[1].trim().replace(/['"]/g, '');
  console.log("DATABASE_URL encontrada en .env");

  // 2. Leer leads JSON
  const jsonPath = path.resolve('../prospecting/output/osm-leads-2026-06-18.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`No existe el archivo JSON de leads en: ${jsonPath}`);
    process.exit(1);
  }
  const leads = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Leídos ${leads.length} leads del archivo JSON.`);

  // 3. Conectar a Postgres
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Conectado exitosamente a PostgreSQL.");

    let importedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const source = 'osm';
      const osmId = lead.osmId;
      const osmType = lead.osmType;
      const businessName = lead.businessName || 'Negocio sin nombre';
      const category = lead.category || '';
      const vertical = slugify(category);
      const address = lead.address || '';
      const phone = lead.phone || '';
      const website = lead.website || '';
      const email = lead.email || '';
      const lat = lead.lat != null ? String(lead.lat) : null;
      const lon = lead.lon != null ? String(lead.lon) : null;
      const city = lead.city || '';
      const mapsUrl = getOsmUrl(lead);
      const sourceQuery = lead.sourceQuery || '';
      const leadScore = Number(lead.leadScore || 0);
      const recommendedOffer = lead.recommendedOffer || '';
      const status = lead.outreachStatus === 'new' ? 'nuevo' : (lead.outreachStatus || 'nuevo');
      const optOut = Boolean(lead.optOut);
      const lastSeenAt = new Date();

      // Verificar si ya existe
      const checkRes = await client.query(
        'SELECT id FROM prospects WHERE source = $1 AND osm_type = $2 AND osm_id = $3',
        [source, osmType, osmId]
      );

      if (checkRes.rows.length > 0) {
        // Actualizar
        const id = checkRes.rows[0].id;
        await client.query(
          `UPDATE prospects SET 
            business_name = $1, category = $2, vertical = $3, address = $4, 
            phone = $5, website = $6, email = $7, lat = $8, lon = $9, 
            city = $10, maps_url = $11, source_query = $12, lead_score = $13, 
            recommended_offer = $14, last_seen_at = $15
           WHERE id = $16`,
          [
            businessName, category, vertical, address,
            phone, website, email, lat, lon,
            city, mapsUrl, sourceQuery, leadScore,
            recommendedOffer, lastSeenAt, id
          ]
        );
        updatedCount++;
      } else {
        // Insertar nuevo
        await client.query(
          `INSERT INTO prospects (
            source, osm_id, osm_type, business_name, category, vertical, 
            address, phone, website, email, lat, lon, city, maps_url, 
            source_query, lead_score, recommended_offer, status, opt_out, 
            last_seen_at, next_action_at, notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
          )`,
          [
            source, osmId, osmType, businessName, category, vertical,
            address, phone, website, email, lat, lon, city, mapsUrl,
            sourceQuery, leadScore, recommendedOffer, status, optOut,
            lastSeenAt, lead.nextActionAt || null, ''
          ]
        );
        importedCount++;
      }

      if ((i + 1) % 100 === 0) {
        console.log(`Procesados ${i + 1}/${leads.length} leads...`);
      }
    }

    console.log(`¡Importación completada con éxito!`);
    console.log(`Nuevos creados en Postgres: ${importedCount}`);
    console.log(`Existentes actualizados en Postgres: ${updatedCount}`);

  } catch (error) {
    console.error("Error durante la importación:", error);
  } finally {
    await client.end();
  }
}

run();
