import * as crypto from "crypto";
import { Effect } from "effect";
import * as jsonwebtoken from "jsonwebtoken";
import { KeyError, KeyService } from "./KeyService";
import { option } from "effect/Config";

const generateKeyPair: KeyService["generateKeyPair"] = () =>
  Effect.async((resume) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: "spki",
          format: "der",
        },
        privateKeyEncoding: {
          type: "pkcs1",
          format: "der",
        },
      },
      (err, publicKey, privateKey) => {
        if (err) {
          resume(Effect.fail({ tag: "key_error", error: err }));
        } else {
          resume(Effect.succeed({ publicKey, privateKey }));
        }
      }
    );
  });

const sign: KeyService["sign"] = (
  input: {},
  privateKey: Buffer,
  options?: jsonwebtoken.SignOptions
) => {
  return (jsonwebtoken as any).default.sign(
    input,
    crypto.createPrivateKey({
      key: privateKey,
      format: "der",
      type: "pkcs1",
    }),
    {
      algorithm: "RS256",
      ...options,
    }
  );
};

const verify: KeyService["verify"] = (input: string, publicKey: Buffer) =>
  (jsonwebtoken as any).default.verify(input, publicKey, {
    algorithms: ["RS256"],
  });

const exportPublickKeyJWK = (
  publicKey: Buffer
): Effect.Effect<never, KeyError, Record<string, unknown>> =>
  Effect.try({
    try: () =>
      crypto
        .createPublicKey({
          format: "der",
          key: publicKey,
          type: "spki",
        })
        .export({
          format: "jwk",
        }),
    catch: (error) => ({
      tag: "key_error",
      error,
    }),
  });

export const provideRsaKeyService = Effect.provideService(KeyService, {
  generateKeyPair,
  sign,
  verify,
  exportPublickKeyJWK,
});
