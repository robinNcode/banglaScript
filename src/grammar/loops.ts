import * as ohm from "ohm-js";
import { transliterateBangla } from "./transliterate";

const loopsGrammar = `
  Loops {
    LoopStatement = ForLoop | WhileLoop | DoWhileLoop

    ForLoop = "জন্য" "(" VariableDeclaration Condition ";" Assignment ")" Block
    WhileLoop = "যতক্ষণ" "(" Condition ")" Block
    DoWhileLoop = "কর" Block "যতক্ষণ" "(" Condition ")" ";"

    Condition = identifier Operator identifier
    Operator = "==" | "!=" | "<" | ">" | "<=" | ">="

    Assignment = identifier "=" identifier Operator? identifier?

    Block = "{" Statement* "}"
    Statement = VariableDeclaration | Assignment | LoopStatement | PrintStatement

    VariableDeclaration = VarType identifier "=" Expression ";"
    VarType = "সংখ্যা" | "হাছামিছা" | "দড়ি" | "বিন্যাস"
    Expression = number | boolean | string | identifier

    identifier = letter (letter | digit)*
    number = digit+
    boolean = "সত্য" | "মিথ্যা"
    PrintStatement = "দেখাও" "(" string ")" ";"
    string = "\\"" (~"\\"" any)* "\\""
  }
`;

const Loops = ohm.grammar(loopsGrammar);
const semantics = Loops.createSemantics();

/**
 * Semantic rules for loops
 */
semantics.addOperation("toTS()", {
  ForLoop(_for, _open, init, condition, _semi, assignment, _close, block) {
    return `for (${init.toTS()} ${condition.toTS()}; ${assignment.toTS()}) ${block.toTS()}`;
  },

  WhileLoop(_while, _open, condition, _close, block) {
    return `while (${condition.toTS()}) ${block.toTS()}`;
  },

  DoWhileLoop(_do, block, _while, _open, condition, _close, _semi) {
    return `do ${block.toTS()} while (${condition.toTS()});`;
  },

  Condition(left, operator, right) {
    return `${transliterateBangla(left.sourceString)} ${operator.sourceString} ${transliterateBangla(right.sourceString)}`;
  },

  Assignment(name, _eq, value, op, extra) {
    let assignment = `${transliterateBangla(name.sourceString)} = ${transliterateBangla(value.sourceString)}`;
    if (op.sourceString) {
      assignment += ` ${op.sourceString} ${transliterateBangla(extra.sourceString)}`;
    }
    return assignment + ";";
  },

  Block(_open, statements, _close) {
    return `{\n${statements.children.map(s => s.toTS()).join("\n")}\n}`;
  },

  VariableDeclaration(type, name, _eq, value, _semicolon) {
    const tsType = {
      "সংখ্যা": "number",
      "হাছামিছা": "boolean",
      "দড়ি": "string",
      "বিন্যাস": "any[]"
    }[type.sourceString] || "any";

    return `let ${transliterateBangla(name.sourceString)}: ${tsType} = ${value.toTS()};`;
  },

  PrintStatement(_print, _open, str, _close, _semicolon) {
    return `console.log(${str.toTS()});`;
  },

  string(_open, chars, _close) {
    return `"${chars.sourceString}"`;
  }
});

/**
 * Function to transpile BanglaScript loops to TypeScript
 * @param code - BanglaScript code
 */
export default function transpileLoops(code: string): string {
  const matchResult = Loops.match(code);
  if (matchResult.failed()) {
    throw new Error("Syntax Error in loop statement: " + matchResult.message);
  }
  return semantics(matchResult).toTS();
}
