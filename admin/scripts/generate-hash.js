import argon2 from "argon2";

const password = process.argv[2];

if (!password) {
  console.error("Por favor, provee una contraseña para hashear.");
  console.error("Uso: node generate-hash.js <tu_contraseña>");
  process.exit(1);
}

async function generate() {
  try {
    const hash = await argon2.hash(password);
    const escapedHash = hash.replace(/\$/g, "\\$");
    console.log("\n✅ Hash generado exitosamente:\n");
    console.log(escapedHash);
    console.log(
      "\nCopia este hash escapado y pégalo en tu archivo admin/.env.local como AUTH_ADMIN_PASSWORD_HASH o AUTH_ADMIN_PASSWORD_HASH_ALT",
    );
    console.log("\nHash original (solo referencia, no lo pegues directo en .env.local):\n");
    console.log(hash);
  } catch (err) {
    console.error("Error al generar el hash:", err);
  }
}

generate();
