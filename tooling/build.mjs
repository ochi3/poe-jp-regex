import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {validateData} from './data/validate.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function build() {
  // Build both programs before emitting either one, so a type error never produces
  // one new game bundle alongside one old game bundle.
  const programs = ['poe1', 'poe2'].map(game => {
    const configPath = path.join(root, `src/${game}/tsconfig.json`);
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
    Object.assign(parsed.options, {outFile: path.join(root, 'assets/js', game + '.js'), composite: false, incremental: false, declaration: false, tsBuildInfoFile: undefined});
    return { game, program: ts.createProgram(parsed.fileNames, parsed.options), errors: parsed.errors };
  });
  const diagnostics = programs.flatMap(({program, errors}) => [...errors, ...ts.getPreEmitDiagnostics(program)]);
  if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: p => p, getCurrentDirectory: () => root, getNewLine: () => '\n'
    }));
    throw new Error(`Build failed: ${diagnostics.length} TypeScript diagnostics`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/manifest.json'), 'utf8'));
  const outputs = Object.fromEntries(['poe1', 'poe2'].map(game => [game, manifest[game].map(({path: dataPath, variable}) => {
    if (!/^[a-zA-Z_$][\w$]*$/.test(variable)) throw new Error(`Invalid data variable: ${variable}`);
    const data = validateData(JSON.parse(fs.readFileSync(path.join(root, dataPath), 'utf8')), variable, dataPath);
    return `const ${variable} = ${JSON.stringify(data)};`;
  }).join('\n') + '\n']));
  fs.mkdirSync(path.join(root, 'assets/js'), {recursive: true});
  for (const {game, program} of programs) {
    const emitted = program.emit();
    if (emitted.emitSkipped) throw new Error(`Emit failed: ${game}`);
    fs.writeFileSync(path.join(root, `assets/js/data-${game}.js`), outputs[game]);
    console.log(`Built ${game}`);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
