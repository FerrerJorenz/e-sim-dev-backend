import crypto from "crypto";

const tsimAccount = process.env.TSIM_ACCOUNT; // Replace with actual account
const tsimSecret = process.env.TSIM_SECRET; // Replace with actual secret

/**
 * Generates a random string for TSIM-NONCE.
 * @param length Length of the nonce (6-32).
 * @returns Randomly generated nonce.
 */
function generateNonce(length: number): string {
  const chars = process.env.CHARS;
  let nonce = "";
  for (let i = 0; i < length; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * Generates headers required for TSIMTECH API requests.
 * @returns Object containing the required headers.
 */
export function generateTsimHeaders(): Record<string, string> {
  const tsimNonce = generateNonce(16); // Adjust length as needed (6-32)
  const tsimTimestamp = Math.floor(Date.now() / 1000).toString(); // Current Unix Timestamp
  const signatureContent = tsimAccount + tsimNonce + tsimTimestamp;

  // Generate HMACSHA256 Signature
  const tsimSign = crypto
    .createHmac("sha256", tsimSecret)
    .update(signatureContent)
    .digest("hex");

  // Return headers
  return {
    "TSIM-ACCOUNT": tsimAccount,
    "TSIM-NONCE": tsimNonce,
    "TSIM-TIMESTAMP": tsimTimestamp,
    "TSIM-SIGN": tsimSign,
  };
}