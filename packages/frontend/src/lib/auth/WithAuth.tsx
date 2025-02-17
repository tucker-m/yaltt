import { pipe, Either, Option, ReadonlyArray, Effect } from "effect";
import * as React from "react";
import { getCurrentUser } from "./userApi";
import * as Eff from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import { provideRequestService } from "../api/requestServiceImpl";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "@yaltt/model";

type WithAuthProps = {
  children: (user: User) => JSX.Element;
};

export const WithAuth = (props: WithAuthProps): JSX.Element => {
  const [user, setUser] = React.useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    Eff.runCallback(
      provideRequestService(getCurrentUser),
      Exit.match({
        onFailure: (err) => {
          const redirectUrl = `/login?redirectUrl=${encodeURIComponent(
            location.pathname + location.search
          )}`;
          navigate(redirectUrl, {
            replace: true,
          });
        },
        onSuccess: (user) => {
          setUser(user);
        },
      })
    );
  }, []);
  if (!user) {
    return <></>;
  } else {
    return props.children(user);
  }
};
