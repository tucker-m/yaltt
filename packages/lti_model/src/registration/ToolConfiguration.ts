import * as S from "@fp-ts/schema";
import { pipe } from "@fp-ts/core/Function";
import { LtiToolConfiguration } from "./LtiToolConfiguration";
import { Url } from "./Url";
import { I18nKey } from "./I18nKey";

const Scopes = S.string;

/**
 * An oidc Tool Configuration for LTI as defined by
 * https://www.imsglobal.org/spec/lti-dr/v1p0#tool-configuration
 */
export const ToolConfiguration = pipe(
  S.struct({
    application_type: S.literal("web"),
    grant_types: S.union(
      S.tuple(S.literal("client_credentials"), S.literal("implicit")),
      S.tuple(S.literal("implicit"), S.literal("client_credentials"))
    ),
    response_types: S.array(S.string),
    redirect_uris: S.array(Url),
    initiate_login_uri: Url,
    jwks_uri: Url,
    logo_uri: S.optional(Url),
    token_endpoint_auth_method: S.literal("private_key_jwt"),
    contacts: S.optional(S.array(S.string)),
    "https://purl.imsglobal.org/spec/lti-tool-configuration":
      LtiToolConfiguration,
    scope: Scopes,
  }),
  S.extend(I18nKey("client_name")),
  S.extend(I18nKey("client_uri")),
  S.extend(I18nKey("tos_uri")),
  S.extend(I18nKey("policy_uri"))
);

export type ToolConfiguration = S.Infer<typeof ToolConfiguration>;
