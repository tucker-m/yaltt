import * as Eff from "@effect/io/Effect";
import * as S from "@fp-ts/schema/Schema";
import * as C from "@fp-ts/data/Context";
import { buffer } from "../lib/BufferSchema";
import { query, query1 } from "../db/db";
import { pipe } from "@fp-ts/data/Function";
import { hashPassword } from "../db/crypto";
import * as PE from "@fp-ts/schema/ParseError";

const UserRow = S.struct({
  id: S.number,
  logins: S.unknown,
});

const PasswordLoginRow = S.struct({
  user_id: S.number,
  username: S.string,
  hashed_password: buffer,
  salt: buffer,
});

export const getLoginByUsername = (username: string) =>
  query1(
    S.struct({
      id: S.number,
      username: S.string,
      hashed_password: buffer,
      salt: buffer,
    })
  )(
    "select id, username, hashed_password, salt from users u join password_logins pl on pl.user_id = u.id where pl.username = $1;",
    [username]
  );

export const addUserWithLocalPassword = (username: string, password: string) =>
  pipe(
    Eff.Do(),
    Eff.bind("pw", () => hashPassword(password)),
    Eff.bind("user", () =>
      query1(UserRow)(
        "insert into users (logins) values ('{}'::jsonb) returning *",
        []
      )
    ),
    Eff.bind("passwordLogin", ({ user, pw }) =>
      query1(PasswordLoginRow)(
        "insert into password_logins (user_id, username, hashed_password, salt) values ($1, $2, $3, $4) returning *",
        [user.id, username, pw.hashedPassword, pw.salt]
      )
    )
  );
