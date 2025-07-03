import { ApolloServerContext } from "../../utils/servers";

/**
 * Called by navbar on each frontend render or upon logging in
 * to display user's email if they are logged in.
 */
export function getUserEmailRoute(req: ApolloServerContext["req"], res: any) {
  res.status(200).send(req.user.email);
}
