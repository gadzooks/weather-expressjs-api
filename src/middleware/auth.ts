import { NextFunction, Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

export const SECRET_KEY: Secret = process.env.TOKEN_SECRET || ''

export interface CustomRequest extends Request {
  token: string | JwtPayload;
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    (req as CustomRequest).token = decoded;

    // {"client":"weather-react-app","routes":["/forecasts/real","/forecasts/mock"],"type":"READONLY","iat":1676358327}
    const routesAllowed = (<any>decoded).routes || []
    if (routesAllowed.includes(req.baseUrl + req.path)) {
      next();
    } else {
      res.status(401).send('Invalid / unauthorized route : ' + req.originalUrl);
    }
  } catch (err) {
    console.log(JSON.stringify(err))
    res.status(401).send('Please authenticate' + err);
  }
};