import handler from './api/franchise.js';
async function test() {
  const req = { method: 'GET', query: { malId: 16498 } };
  const res = {
    setHeader: () => {},
    status: (code) => ({
      json: (data) => console.log(JSON.stringify(data, null, 2)),
      end: () => console.log('end')
    })
  };
  await handler(req, res);
}
test();
