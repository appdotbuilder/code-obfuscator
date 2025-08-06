
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas and handlers
import { 
  createObfuscationJobInputSchema, 
  fileUploadInputSchema, 
  downloadRequestSchema 
} from './schema';
import { createObfuscationJob } from './handlers/create_obfuscation_job';
import { uploadFile } from './handlers/upload_file';
import { downloadObfuscatedCode } from './handlers/download_obfuscated_code';
import { getObfuscationStatus } from './handlers/get_obfuscation_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create obfuscation job from pasted code
  createObfuscationJob: publicProcedure
    .input(createObfuscationJobInputSchema)
    .mutation(({ input }) => createObfuscationJob(input)),

  // Upload and process file(s)
  uploadFile: publicProcedure
    .input(fileUploadInputSchema)
    .mutation(({ input }) => uploadFile(input)),

  // Download obfuscated code using token
  downloadObfuscatedCode: publicProcedure
    .input(downloadRequestSchema)
    .query(({ input }) => downloadObfuscatedCode(input)),

  // Get obfuscation job status
  getObfuscationStatus: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(({ input }) => getObfuscationStatus(input.jobId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
