// Tiny stack VM, ISA v1 (kit: program/generator/subject/ISA.md). One run answers
// all 40 instances: reads /input/<id>/program.bin + input.bin, writes
// /output/<id>/stdout.bin + exit.txt. Plain JS, Node stdlib only, deterministic.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const S = new Int8Array(256).fill(-1); // opcode -> imm | pops<<3 | pushes<<5
const D = (o, i, p, q) => { S[o] = i | (p << 3) | (q << 5); };
D(0x00, 0, 0, 0); D(0x01, 1, 0, 1); D(0x02, 4, 0, 1); D(0x03, 0, 1, 0);
D(0x04, 0, 1, 2); D(0x05, 0, 2, 2); D(0x06, 0, 2, 3); D(0x07, 0, 3, 3);
for (const o of [0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x18, 0x19, 0x1a, 0x1c, 0x1d, 0x1e, 0x20, 0x21, 0x22]) D(o, 0, 2, 1);
D(0x17, 0, 1, 1); D(0x1b, 0, 1, 1);
D(0x30, 2, 0, 0); D(0x31, 2, 1, 0); D(0x32, 2, 1, 0); D(0x33, 2, 0, 0); D(0x34, 0, 0, 0);
D(0x40, 0, 1, 1); D(0x41, 0, 2, 0);
D(0x50, 0, 1, 0); D(0x51, 0, 1, 0); D(0x52, 0, 0, 1); D(0x53, 0, 1, 0);

function run(P, N) {
  const n = P.length, st = new Int32Array(256), cs = new Int32Array(64), mem = new Int32Array(256);
  const out = new Uint8Array(65536);
  let sp = 0, cp = 0, ol = 0, ip = 0, pc = 0, steps = 0;
  const end = (c) => [c, out.slice(0, ol)];
  for (;;) {
    if (steps === 1000000) return end(10);
    if (pc < 0 || pc >= n) return end(9);
    const s = S[P[pc]];
    if (s < 0) return end(5);
    const imm = s & 7;
    if (pc + imm >= n) return end(9);
    steps++;
    const nx = pc + 1 + imm, pops = (s >> 3) & 3, push = (s >> 5) & 3;
    if (sp < pops) return end(2);
    if (sp - pops + push > 256) return end(3);
    const op = P[pc];
    pc = nx;
    switch (op) {
      case 0x00: return end(0);
      case 0x01: st[sp++] = (P[nx - 1] << 24) >> 24; break;
      case 0x02: st[sp++] = P[nx - 4] | (P[nx - 3] << 8) | (P[nx - 2] << 16) | (P[nx - 1] << 24); break;
      case 0x03: sp--; break;
      case 0x04: st[sp] = st[sp - 1]; sp++; break;
      case 0x05: { const t = st[sp - 1]; st[sp - 1] = st[sp - 2]; st[sp - 2] = t; break; }
      case 0x06: st[sp] = st[sp - 2]; sp++; break;
      case 0x07: { const a = st[sp - 3]; st[sp - 3] = st[sp - 2]; st[sp - 2] = st[sp - 1]; st[sp - 1] = a; break; }
      case 0x17: st[sp - 1] = (-st[sp - 1]) | 0; break;
      case 0x1b: st[sp - 1] = ~st[sp - 1]; break;
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
      case 0x20: case 0x21: case 0x22: {
        const b = st[sp - 1], a = st[sp - 2];
        if ((op === 0x13 || op === 0x14 || op === 0x15 || op === 0x16) && b === 0) return end(4);
        let r;
        if (op === 0x10) r = (a + b) | 0;
        else if (op === 0x11) r = (a - b) | 0;
        else if (op === 0x12) r = Math.imul(a, b);
        else if (op === 0x13) r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
        else if (op === 0x14) r = b === -1 ? 0 : (a % b) | 0;
        else if (op === 0x15) r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
        else if (op === 0x16) r = ((a >>> 0) % (b >>> 0)) | 0;
        else if (op === 0x18) r = a & b;
        else if (op === 0x19) r = a | b;
        else if (op === 0x1a) r = a ^ b;
        else if (op === 0x1c) r = a << (b & 31);
        else if (op === 0x1d) r = a >> (b & 31);
        else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
        else if (op === 0x20) r = a === b ? 1 : 0;
        else if (op === 0x21) r = a < b ? 1 : 0;
        else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        sp -= 2;
        st[sp++] = r;
        break;
      }
      case 0x30: case 0x31: case 0x32: {
        const rel = ((P[nx - 2] | (P[nx - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 0x30) { const v = st[--sp]; take = op === 0x31 ? v === 0 : v !== 0; }
        if (take) pc = nx + rel;
        break;
      }
      case 0x33:
        if (cp === 64) return end(7);
        cs[cp++] = nx;
        pc = P[nx - 2] | (P[nx - 1] << 8);
        break;
      case 0x34:
        if (cp === 0) return end(8);
        pc = cs[--cp];
        break;
      case 0x40: {
        const a = st[sp - 1];
        if (a < 0 || a >= 256) return end(6);
        st[sp - 1] = mem[a];
        break;
      }
      case 0x41: {
        const a = st[sp - 1], v = st[sp - 2];
        if (a < 0 || a >= 256) return end(6);
        sp -= 2;
        mem[a] = v;
        break;
      }
      case 0x50: {
        const s = String(st[sp - 1]);
        if (ol + s.length > 65536) return end(11);
        sp--;
        for (let i = 0; i < s.length; i++) out[ol++] = s.charCodeAt(i);
        break;
      }
      case 0x51:
        if (ol + 1 > 65536) return end(11);
        out[ol++] = st[--sp] & 255;
        break;
      case 0x52:
        st[sp++] = ip < N.length ? N[ip++] : -1;
        break;
      case 0x53: return end(st[--sp] & 255);
    }
  }
}

for (let i = 1; i <= 40; i++) {
  const id = 'i' + String(i).padStart(3, '0');
  const dir = join(I, id);
  const [exit, stdout] = run(readFileSync(join(dir, 'program.bin')), readFileSync(join(dir, 'input.bin')));
  const od = join(O, id);
  mkdirSync(od, { recursive: true });
  writeFileSync(join(od, 'stdout.bin'), stdout);
  writeFileSync(join(od, 'exit.txt'), String(exit) + '\n');
}
