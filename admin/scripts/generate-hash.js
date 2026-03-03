const { randomBytes, scrypt } = require("node:crypto");

const HASH_PREFIX = "scrypt";
const SCRYPT_N = 1 << 14;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

const password = process.argv[2];

if (!password) {
  console.error("Por favor, provee una contraseña para hashear.");
  console.error("Uso: node scripts/generate-hash.js <tu_contraseña>");
  process.exit(1);
}

function createPasswordHash(input) {
  const salt = randomBytes(SALT_LENGTH);

  return new Promise((resolve, reject) => {
    scrypt(
      input,
      salt,
      KEY_LENGTH,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: 128 * SCRYPT_N * SCRYPT_R * 2,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(
          [
            HASH_PREFIX,
            String(SCRYPT_N),
            String(SCRYPT_R),
            String(SCRYPT_P),
            salt.toString("base64url"),
            Buffer.from(derivedKey).toString("base64url"),
          ].join(":"),
        );
      },
    );
  });
}

async function main() {
  try {
    const hash = await createPasswordHash(password);
    console.log("\nHash generado exitosamente:\n");
    console.log(hash);
    console.log(
      "\nPégalo directamente en admin/.env.local o en Vercel como AUTH_ADMIN_PASSWORD_HASH / AUTH_ADMIN_PASSWORD_HASH_ALT.",
    );
    console.log("Este formato ya no usa $ y no necesita escapes.");
  } catch (error) {
    console.error("Error al generar el hash:", error);
    process.exit(1);
  }
}

main();
