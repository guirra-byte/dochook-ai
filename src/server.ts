import fastify from "./app.js";
async function main() {
  try {
    fastify.listen({ port: 3333 }).then((port) => {
      const awsEnvironmentVar = [
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY,
      ];

      if (awsEnvironmentVar.some((credential) => credential === undefined)) {
        throw new Error("AWS should be defined...");
      }

      console.log(`Server already is running on ${port}`);
    });
  } catch (error) {
    console.error(error);
  }
}

main();
