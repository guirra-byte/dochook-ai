import type { FastifyReply, FastifyRequest } from "fastify";

export interface PresignedUploadedDocument {
  key: string;
  filename: string;
  presignedUrl: string;
  uploadedAt: Date | string;
}

export interface DocumentsUploadedRequest {
  batchTag: string;
  bucket: string;
  documents: PresignedUploadedDocument[];
}

export default class DocumentsController {
  static async documentsUploaded(
    request: FastifyRequest<{ Body: DocumentsUploadedRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { batchTag, documents } = request.body;
    } catch (error) {}
  }
}
