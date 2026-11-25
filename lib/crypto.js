import {createHmac, timingSafeEqual, createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';

export function agoraBrasilia(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).map(({type,value}) => [type,value]));
  const {year,month,day} = parts;
  const reverse = value => [...value].reverse().join('');
  return {date: year + month + day, password: month + reverse(day) + reverse(year)};
}

export function iguais(a,b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x,y);
}

export function assinar(secret, value) {
  return createHmac('sha256',secret).update('sessao:' + value).digest('base64url');
}

function chave(secret) {
  if (!secret || secret.length < 32) throw new Error('COURSE_SECRET ausente ou curto');
  return createHmac('sha256',secret).update('material do curso v1').digest();
}

export function cifrar(secret, data) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm',chave(secret),iv);
  const payload = Buffer.concat([cipher.update(data),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),payload]);
}

export function decifrar(secret, data) {
  const decipher = createDecipheriv('aes-256-gcm',chave(secret),data.subarray(0,12));
  decipher.setAuthTag(data.subarray(12,28));
  return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]);
}
