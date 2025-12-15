const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { loadSchemaSync } = require('@graphql-tools/load');
const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader');
const { join } = require('path');
const cors = require('cors');
const helmet = require('helmet');

const { createContext } = require('./context');
const resolvers = require('./resolvers');
const { startScheduler } = require('./scheduler');

// Load GraphQL schema files
const typeDefs = loadSchemaSync(join(__dirname, 'schema/**/*.graphql'), {
    loaders: [new GraphQLFileLoader()]
});

// Create Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    formatError: (error) => {
        console.error('GraphQL Error:', error);

        // Return formatted error
        return {
            message: error.message,
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.extensions?.exception?.stacktrace
            })
        };
    },
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production'
});

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
}));
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'graphql-service' });
});

async function startServer() {
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    const PORT = process.env.GRAPHQL_PORT || 4000;
    const HOST = '0.0.0.0'; // Bind to all network interfaces

    app.listen(PORT, HOST, () => {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();

        // Get local IP address
        let localIP = 'localhost';
        for (const name of Object.keys(networkInterfaces)) {
            for (const net of networkInterfaces[name]) {
                // Skip internal and non-IPv4 addresses
                if (net.family === 'IPv4' && !net.internal) {
                    localIP = net.address;
                    break;
                }
            }
        }

        console.log(`🚀 GraphQL Server running on:`);
        console.log(`   Local:   http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`   Network: http://${localIP}:${PORT}${server.graphqlPath}`);
        console.log(`📊 GraphQL Playground available at both URLs`);

        // Start maintenance scheduler
        startScheduler();
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

module.exports = app;
