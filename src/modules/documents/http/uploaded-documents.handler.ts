import type { S3Event, Context } from "aws-lambda";
export const handler = async (event: S3Event, context: Context) => {
  Iterator.from(event.Records).map((s3Event) => {
    const {
      eventName,
      s3: { bucket, object },
    } = s3Event;

    if (
      eventName === "ObjectCreated:Put" ||
      eventName === "ObjectCreated:Post"
    ) {
      return { object };
    }
  });
};
