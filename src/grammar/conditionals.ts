import * as ohm from 'ohm-js';
import { transliterateBangla } from "../utils/transliterate.ts";

/**
 * Define Ohm grammar for conditional statements in BanglaScript
 */
const conditionalsGrammar = `
Conditionals {
  Program = Statement*
  Statement = IfStatement | BlockStatement
  IfStatement = "যদি" "(" Expression ")" BlockStatement ElseIfStatement* ElseStatement?
  ElseIfStatement = "নয়তোযদি" "(" Expression ")" BlockStatement
  ElseStatement = "নয়তো" BlockStatement
  BlockStatement = "{" Statement* "}"

  Expression = boolean | identifier | Comparison
  Comparison = Expression ComparisonOp Expression
  ComparisonOp = "==" | "!=" | ">" | "<" | ">=" | "<="

  identifier = letter (letter | digit | "_")*
  boolean = "সত্য" | "মিথ্যা"
}
`;

const Conditionals = ohm.grammar(conditionalsGrammar);
const semantics = Conditionals.createSemantics();

semantics.addOperation('toTS()', {
  Program(statements) {
    return statements.children.map((s) => s.toTS()).join("\n");
  },

  IfStatement(_if, _open, condition, _close, ifBlock, elseIfs, elseStmt) {
    return `if (${condition.toTS()}) ${ifBlock.toTS()}\n` +
      elseIfs.children.map((e) => e.toTS()).join("\n") +
      (elseStmt.numChildren ? `\n${elseStmt.toTS()}` : "");
  },

  ElseIfStatement(_elseif, _open, condition, _close, block) {
    return `else if (${condition.toTS()}) ${block.toTS()}`;
  },

  ElseStatement(_else, block) {
    return `else ${block.toTS()}`;
  },

  BlockStatement(_open, statements, _close) {
    return `{\n  ${statements.children.map((s) => s.toTS()).join("\n  ")}\n}`;
  },

  Comparison(left, op, right) {
    return `${left.toTS()} ${op.sourceString} ${right.toTS()}`;
  },

  identifier(name) {
    return transliterateBangla(name.sourceString);
  },

  boolean(value) {
    return value.sourceString === "সত্য" ? "true" : "false";
  }
});


export default function transpileConditionals(code: string): string {
  const matchResult = Conditionals.match(code);
  if (matchResult.failed()) {
    throw new Error("ত্রুটি: " + matchResult.message);
  }
  return semantics(matchResult).toTS();
}
