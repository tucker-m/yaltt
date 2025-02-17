import * as crypto from "crypto";
import { Effect, Option, ReadonlyArray, pipe } from "effect";
import { RegistrationRow } from "../model/entities/registrations";
import { Fetch } from "../fetch/FetchService";
import nJwt from "njwt";
import { getKeyForRegistrationId } from "../model/entities/keys";
import { signJwt } from "../crypto/KeyService";

export const fetchToken = (
  registration: RegistrationRow,
  deployment_id?: string
) =>
  pipe(
    getKeyForRegistrationId(registration.id),
    Effect.bindTo("key"),
    Effect.bind("token", ({ key }) =>
      signJwt(
        deployment_id
          ? {
              "https://purl.imsglobal.org/spec/lti/claim/deployment_id":
                deployment_id,
            }
          : {},
        key.private_key,
        {
          expiresIn: "1h",
          audience: registration.platform_configuration.token_endpoint,
          issuer: registration.client_id || "",
          subject: registration.client_id || "",
          keyid: key.id.toString(),
          jwtid: crypto.randomBytes(16).toString("hex"),
        }
      )
    ),
    Effect.flatMap(({ token }) => {
      const encodeGetParams = (p: Record<string, string>) =>
        Object.entries(p)
          .map((kv) => kv.map(encodeURIComponent).join("="))
          .join("&");

      const params = {
        client_assertion_type:
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        client_assertion: token,
        grant_type: "client_credentials",
        scope: registration.scopes.join(" "),
        ...(registration.client_id
          ? { client_id: registration.client_id }
          : {}),
      };
      return Fetch.post(
        `${
          registration.platform_configuration.token_endpoint
        }?${encodeGetParams(params)}`,
        {}
      );
    })
    // Fetch.get(registration.platform_configuration.token_endpoint)
  );
