const configuration = () => ({
    NODE_ENV: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10) || 5000,
    MONGO_DB_URL: process.env.MONGO_DB_URL,
    // JWT_SECRET: process.env.JWT_SECRET,
    // MAILTRAP_HOST: process.env.MAILTRAP_HOST,
    // MAILTRAP_PORT: parseInt(process.env.MAILTRAP_PORT, 10) || 2525,
    // MAILTRAP_USER: process.env.MAILTRAP_USER,
    // MAILTRAP_PASSWORD: process.env.MAILTRAP_PASSWORD,
});

export default configuration;