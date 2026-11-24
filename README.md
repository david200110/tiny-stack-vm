# Tiny Stack VM

A compact, correct implementation of make.fun's tiny stack ISA v1: 32-bit
wrapping integers, a 256-value stack, calls, 256 words of memory, input and
output, and all ten traps with their exact exit codes. One run answers all
40 instances of a set.

[![make.fun](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![make.fun](https://make.fun/badge/tiny-stack-vm-01-run-20261122/david200110/tiny-stack-vm/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![make.fun](https://make.fun/badge/tiny-stack-vm-01-run-20261122/david200110/tiny-stack-vm/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

Run it with Node 22: `node main.ts` reads `/input/<id>/program.bin` and
`input.bin` (or `$MAKEFUN_INPUT_DIR`) and writes `/output/<id>/stdout.bin`
and `exit.txt` for `i001`–`i040`.
