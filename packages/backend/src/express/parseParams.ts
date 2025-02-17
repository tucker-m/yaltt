import { pipe, Effect, Option, Either } from "effect";
import * as S from "@effect/schema/Schema";
import { effRequestHandler, successResponse } from "./effRequestHandler";
import { ExpressRequestService } from "./RequestService";
import { ParseError } from "@effect/schema/ParseResult";
import { transplant } from "effect/Effect";
import { tap } from "../util/tap";

export interface ParseParamsError {
  tag: "parse_params_error";
  params: unknown;
  error: ParseError;
}

export interface ParseQueryError {
  tag: "parse_query_error";
  query: unknown;
  error: ParseError;
}

export const parseQueryError = (
  query: unknown,
  error: ParseError
): ParseQueryError => ({
  tag: "parse_query_error",
  query,
  error,
});

export const parseParamsError = (
  params: unknown,
  error: ParseError
): ParseParamsError => ({
  tag: "parse_params_error",
  params,
  error,
});

export const parseQuery = <A>(querySchema: S.Schema<any, A>) =>
  ExpressRequestService.pipe(
    Effect.flatMap(({ request }) =>
      pipe(
        S.parse(querySchema)(request.query, { onExcessProperty: "ignore" }),
        Effect.mapError((error) => parseQueryError(request.query, error))
      )
    )
  );

export const parseParams = <A>(paramsSchema: S.Schema<any, A>) =>
  ExpressRequestService.pipe(
    Effect.flatMap(({ request }) =>
      pipe(
        S.parse(paramsSchema)(request.params, { onExcessProperty: "ignore" }),
        Effect.mapError((error) => parseParamsError(request.params, error))
      )
    )
  );

export const parseBodyOrParams = <A>(schema: S.Schema<A>) =>
  ExpressRequestService.pipe(
    Effect.flatMap(({ request }) =>
      pipe(
        S.parse(schema)(request.body, { onExcessProperty: "ignore" }),
        Effect.orElse(() =>
          S.parse(schema)(request.params, { onExcessProperty: "ignore" })
        ),
        Effect.mapError((error) => parseParamsError(request.params, error))
      )
    )
  );

export const parseBody = <A>(paramsSchema: S.Schema<A>) =>
  ExpressRequestService.pipe(
    Effect.flatMap(({ request }) =>
      pipe(
        request.body,
        S.parse(paramsSchema),
        Effect.mapError((error) => parseParamsError(request.params, error))
      )
    )
  );

export const withRequestParams =
  <A>(paramsSchema: S.Schema<A>) =>
  (
    handler: (
      params: A
    ) => Effect.Effect<ExpressRequestService, ParseParamsError, A>
  ) =>
    effRequestHandler(
      pipe(
        parseParams(paramsSchema),
        Effect.flatMap(handler),
        Effect.map(successResponse)
      )
    );
