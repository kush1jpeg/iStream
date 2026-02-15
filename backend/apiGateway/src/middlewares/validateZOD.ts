import type { Request, Response, NextFunction } from "express";

export const validate =
  (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body); // or req.query / req.params
      next();
    } catch (err) {
      return res.status(400).json({ error: err });
    }
  };
