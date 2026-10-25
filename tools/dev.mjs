import { spawn } from 'node:child_process'
const children=[spawn(process.execPath,['server/native.mjs'],{stdio:'inherit'}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','0.0.0.0',...process.argv.slice(2)],{stdio:'inherit'})]
let stopping=false
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),200).unref()}
for(const child of children)child.on('exit',code=>stop(code||0))
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop())
