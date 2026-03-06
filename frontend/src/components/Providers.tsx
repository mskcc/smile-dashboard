import { ReactNode } from "react";
import { WarningModalProvider } from "../contexts/WarningContext";
import { PhiEnabledProvider } from "../contexts/PhiEnabledContext";
import { UserEmailProvider } from "../contexts/UserEmailContext";
import { offsetLimitPagination } from "@apollo/client/utilities";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const apolloCache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        requests: offsetLimitPagination(),
      },
    },
    DashboardSample: {
      // History records share the same smileSampleId but differ by importDate,
      // so we include importDate as a secondary key to prevent Apollo from
      // collapsing all history versions into a single normalized cache entry.
      keyFields: ["smileSampleId", "recordId"],
    },
  },
});

const apolloClient = new ApolloClient({
  uri: `${process.env.REACT_APP_EXPRESS_SERVER_ORIGIN}/graphql`,
  cache: apolloCache,
  credentials: "include",
  connectToDevTools: true,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <UserEmailProvider>
        <WarningModalProvider>
          <PhiEnabledProvider>{children}</PhiEnabledProvider>
        </WarningModalProvider>
      </UserEmailProvider>
    </ApolloProvider>
  );
}
