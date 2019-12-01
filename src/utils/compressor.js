import pako from 'pako';

export function compress (data) {
  return Buffer.from(pako.deflate(JSON.stringify(data))).toString('base64');
}

export function uncompress (base64) {
  return JSON.parse(pako.inflate(Buffer.from(base64, 'base64'), { to: 'string' }));
}
