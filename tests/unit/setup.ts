import '@testing-library/jest-dom';

// Server-only Convex functions (ADR 0003) check this secret; tests send it like our server does.
process.env.CONVEX_SERVER_SECRET = 'unit-test-secret';
