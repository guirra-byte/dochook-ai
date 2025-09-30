import { logger, schedules, wait, queue, task } from "@trigger.dev/sdk/v3";
import OpenAiProvider from "../openai/index.js";
import { type MarkdownDocumentToDispatchRequest as Payload } from "../../../modules/documents/services/markdown-dispatcher.consumer.js";

interface InsightResponse {
  id: string;
  name: string;
  email: string;
}

const openAi = OpenAiProvider.init();
export const extractData = task({
  id: "ai-driven-data-extraction",
  queue: {
    concurrencyLimit: 5,
  },
  run: async ({
    payload,
    callbacks,
  }: {
    payload: Payload[];
    callbacks: {
      onSucces: () => Promise<void>;
      onFailure: () => Promise<void>;
    };
  }) => {
    Iterator.from(payload).map(({ id, ...data }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await openAi.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [''
              {
                role: "system",
                content: `Responda ESTRITAMENTE com um único JSON válido.
                  - Proibido texto fora do JSON.
                  - Siga exatamente esta interface (chaves e tipos).
                  - Se não houver dado, use "" ou [].`,
              },
              { role: "user", content: "..." },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "insight_schema",
                schema: {
                  $schema: "https://json-schema.org/draft/2020-12/schema",
                  $id: "https://exemplo.com/schemas/usuario.schema.json",
                  title: "Usuario",
                  description: "Schema para um documento de usuário simples",
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "name", "email"],
                  properties: {
                    id: {
                      type: "string",
                      description: "Identificador único do usuário",
                    },
                    name: {
                      type: "string",
                      description: "Nome completo do usuário",
                    },
                    email: {
                      type: "string",
                      format: "email",
                      description: "Endereço de e-mail válido do usuário",
                    },
                  },
                },
              },
            },
          });

          const targetResponse = response.choices[0];
          if (!targetResponse || !targetResponse.message.content) {
            throw new Error();
          }

          resolve(
            JSON.parse(targetResponse.message.content) as InsightResponse
          );
        } catch (error) {
          reject(error);
        }
      });
    });
  },
  onSuccess: async (payload, output, params) => {},
  onFailure: async () => {},
});

// export const firstScheduledTask = queue().({
//   id: "first-scheduled-task",
//   // Every hour
//   cron: "0 * * * *",
//   // Set an optional maxDuration to prevent tasks from running indefinitely
//   maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
//   run: async (payload, { ctx }) => {
//     // The payload contains the last run timestamp that you can use to check if this is the first run
//     // And calculate the time since the last run
//     const distanceInMs =
//       payload.timestamp.getTime() - (payload.lastTimestamp ?? new Date()).getTime();

//     logger.log("First scheduled tasks", { payload, distanceInMs });

//     // Wait for 5 seconds
//     await wait.for({  });

//     // Format the timestamp using the timezone from the payload
//     const formatted = payload.timestamp.toLocaleString("en-US", {
//       timeZone: payload.timezone,
//     });

//     logger.log(formatted);
//   },

// });
