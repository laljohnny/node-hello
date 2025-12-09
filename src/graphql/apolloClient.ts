import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink, Observable } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// HTTP Link - GraphQL endpoint
const httpLink = createHttpLink({
  // uri: "http://localhost:3100/graphql",
  uri: "http://admin.criticalasset.com/api",
  // uri: "http://localhost:4000/graphql",
});

// Auth Link - Add token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Helper function to handle unauthorized errors
const handleUnauthorized = () => {
  // Clear all localStorage items
  localStorage.clear();
  // Redirect to login page
  window.location.href = "/login";
};

// Error Link - Handle errors globally
const errorLink = new ApolloLink((operation, forward) => {
  const observable = forward(operation);

  return new Observable((observer) => {
    const subscription = observable.subscribe({
      next: (result: any) => {
        // Handle GraphQL errors
        if (result.errors) {
          result.errors.forEach((error: any) => {
            console.error(`GraphQL error: Message: ${error.message}, Path: ${error.path}`);

            // Check for unauthorized errors in GraphQL response
            const errorCode = error.extensions?.code || error.extensions?.exception?.statusCode;
            if (errorCode === 401 || errorCode === 403 ||
              error.message?.toLowerCase().includes('unauthorized') ||
              error.message?.toLowerCase().includes('forbidden')) {
              handleUnauthorized();
              return;
            }
          });
        }
        observer.next(result);
      },
      error: (error: any) => {
        console.error(`Network error: ${error}`);

        // Handle 401/403 unauthorized errors from network
        const statusCode = error.statusCode ||
          (error as any).status ||
          (error as any).networkError?.statusCode ||
          error.networkError?.statusCode;

        if (statusCode === 401 || statusCode === 403) {
          handleUnauthorized();
          return;
        }

        observer.error(error);
      },
      complete: () => {
        observer.complete();
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  });
});

// Create Apollo Client
const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
  },
});

export default apolloClient;

