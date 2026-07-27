/**
 * SECURITY. Resolves the JWT signing secret, failing fast if it is missing.
 *
 * Both the signer (AuthModule) and the verifier (JwtStrategy) previously fell
 * back to the literal string "your-secret-key-change-in-production" when
 * JWT_SECRET was unset. Because both sides shared that fallback, the app would
 * boot and work normally — while anyone who knows the string (it is in this
 * repo's git history, and in every tutorial it was copied from) could forge a
 * token for any user in any organisation.
 *
 * A missing signing secret is not a recoverable condition, so this throws
 * rather than degrading to a known-insecure default.
 */
export function requireJwtSecret(value?: string | null): string {
  const secret = value ?? process.env.JWT_SECRET;

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "JWT_SECRET is not set. Refusing to start: falling back to a default " +
        "secret would let anyone forge authentication tokens. Set JWT_SECRET " +
        "in the environment (see .env.example).",
    );
  }

  if (secret === "your-secret-key-change-in-production") {
    throw new Error(
      "JWT_SECRET is still the placeholder value. Refusing to start: this " +
        "string is public, so tokens signed with it can be forged by anyone.",
    );
  }

  return secret;
}
