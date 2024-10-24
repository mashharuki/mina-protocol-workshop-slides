import { Bytes } from 'o1js';

const Bytes32 = Bytes(32);

const b = Bytes32.fromString('test'.padEnd(32, '0'));

console.log(b.toHex());
