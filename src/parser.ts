import * as ohm from 'ohm-js';
import fs from 'fs';
import path from 'path';

// Load grammar from files dynamically
const grammarPath = path.join(__dirname, 'grammars', 'main.ohm');
const banglaGrammar = fs.readFileSync(grammarPath, 'utf-8');

// Create the Ohm grammar object
const BanglaScript = ohm.grammar(banglaGrammar);
const semantics = BanglaScript.createSemantics();

/**
 * Define the semantics for transpiling BanglaScript to TypeScript
 */
semantics.addOperation('toTS()', {
  Program(statements) {
    return statements.children.map((s) => s.toTS()).join("\n");
  },
  ConsoleLogStatement(_write, _openParen, str, _closeParen, _semicolon) {
    return `console.log(${str.toTS()});`;
  },
  VariableDeclaration(type, name, _eq, value, _semicolon) {
    const tsType = {
      "সংখ্যা": "number",
      "হাছামিছা": "boolean",
      "দড়ি": "string",
      "বিন্যাস": "array"
    }[type.sourceString] || "any";
    console.log(`ধরি ${name.sourceString}: ${tsType} = ${value.toTS()};`);
    return `ধরি ${name.sourceString}: ${tsType} = ${value.toTS()};`;
  },
  FunctionDeclaration(_func, name, _open, params, _close, _openBody, body, _closeBody) {
    return `function ${name.sourceString}(${params.toTS()}) {\n${body.toTS()}\n}`;
  },
  IfElseStatement(_if, _open, condition, _close, _openBody, body, _closeBody) {
    return `if (${condition.toTS()}) {\n${body.toTS()}\n}`;
  },
  LoopStatement_forLoop(_for, _open, init, _semi1, condition, _semi2, increment, _close, _openBody, body, _closeBody) {
    return `for (${init.toTS()}; ${condition.toTS()}; ${increment.toTS()}) {\n${body.toTS()}\n}`;
  },
  LoopStatement_whileLoop(_while, _open, condition, _close, _openBody, body, _closeBody) {
    return `while (${condition.toTS()}) {\n${body.toTS()}\n}`;
  },
  LoopStatement_doWhileLoop(_do, _openBody, body, _closeBody, _while, _open, condition, _close, _semi) {
    return `do {\n${body.toTS()}\n} while (${condition.toTS()});`;
  },
  ClassDeclaration(_class, name, _openBody, body, _closeBody) {
    return `class ${name.sourceString} {\n${body.toTS()}\n}`;
  },
  string(_open, chars, _close) {
    return `"${chars.sourceString}"`;
  },
  identifier(chars) {
    return chars.sourceString;
  },
  number(chars) {
    return chars.sourceString;
  },
  boolean(chars) {
    if(chars.sourceString === "সত্য") {
      return "true";
    }
    else if(chars.sourceString === "মিথ্যা") {
      return "false";
    }
    else {
      throw new Error("আপনি ভুল বুলিয়ান মান দিয়েছেন: " + chars.sourceString);
    }
  }
});

/**
 * Function to transpile BanglaScript code to TypeScript
 * @param code - BanglaScript code
 */
export default function transpileBanglaScript(code: string): string {
  const matchResult = BanglaScript.match(code);
  if (matchResult.failed()) {
    throw new Error("Syntax Error: " + matchResult.message);
  }
  return semantics(matchResult).toTS();
}
