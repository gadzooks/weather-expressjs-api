import { NextFunction, Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

export const SECRET_KEY: Secret = process.env.TOKEN_SECRET || ''

export interface CustomRequest extends Request {
  token: string | JwtPayload;
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(JSON.stringify(req.header('Authorization')))
    const token = req.header('Authorization')?.replace('Bearer ', '')

    console.log(token)
    if (!token) {
      throw new Error();
    }

    console.log('key is ' + SECRET_KEY)
    const decoded = jwt.verify(token, SECRET_KEY);
    (req as CustomRequest).token = decoded;

    console.log(JSON.stringify(decoded))
    next();
  } catch (err) {
    console.log(JSON.stringify(err))
    res.status(401).send('Please authenticate');
  }
};