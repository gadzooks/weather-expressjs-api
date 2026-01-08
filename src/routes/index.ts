// import {sum} from '../test-ts.js';
import express from 'express';

/* GET home page. */
const router = express.Router();
router.get('/', function (_req, res) {
  res.send('index');
});

export default router;
