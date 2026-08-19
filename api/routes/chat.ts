import { Router, type Request, type Response } from 'express';
import { handleChatStream } from '../_chatHandler.js';

const router = Router();

router.get('/stream', async (req: Request, res: Response) => {
  await handleChatStream(
    req,
    res,
    { message: req.query.message as string | undefined, token: req.query.token as string | undefined },
  );
});

export default router;
