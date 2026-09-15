import { createServer } from 'http';
import handler from './api/franchise.js';

const req = {
  method: 'GET',
  query: { malId: 16498 }
};

const res = {
  setHeader: () => {},
  status: (code) => {
    return {
      json: (data) => {
        console.log("Status:", code);
        console.log("Data:", data.error || "Success");
      },
      end: () => {}
    }
  }
};

handler(req, res);
