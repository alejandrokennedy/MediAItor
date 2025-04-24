// console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 20) + "..." : "Database URL is undefined");