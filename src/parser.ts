import * as ohm from 'ohm-js';

const banglaGrammar = `
  BanglaScript {
    Program = Statement*
    Statement = "দেখাও" "(" string ")" ";"  -- print
    string = "\\"" (~"\\"" any)* "\\""
  }
`;

/**
 * Create a new BanglaScript grammar
 */
const BanglaScript = ohm.grammar(banglaGrammar);
const semantics = BanglaScript.createSemantics();

/**
 * Define the semantics of the grammar
 */
semantics.addOperation('toTS()', {
  Program(statements) {
    return statements.children.map((s) => s.toTS()).join("\n");
  },
  Statement_print(_write, _openParen, str, _closeParen, _semicolon) {
    return `console.log(${str.toTS()});`;
  },
  string(_open, chars, _close) {
    return `"${chars.sourceString}"`;
  },
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
