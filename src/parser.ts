import * as ohm from 'ohm-js';
import { transliterateBangla } from "./utils/transliterate.ts";

const banglaGrammar = `
  BanglaScript {
    Program = Statement*
    Statement = "দেখাও" "(" string ")" ";"  -- print
    VariableDeclaration = "ধরি" VarType identifier "=" Expression ";"
    VarType = "সংখ্যা" | "হাছামিছা" | "দড়ি" | "বিন্যাস" | "সংখ্যা_বিন্যাস" | "দড়ি_বিন্যাস"
    Expression = number | boolean | string | identifier | ArrayExpression
    ArrayExpression = "[" ListOf<Expression, ","> "]"
    identifier = letter (letter | digit | "_")*
    number = digit+
    boolean = "সত্য" | "মিথ্যা"
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
  VariableDeclaration(_dhori, type, name, _eq, value, _semicolon) {
    console.log(type.sourceString);

    const tsTypeMap: Record<string, string> = {
      "সংখ্যা": "number",
      "হাছামিছা": "boolean",
      "দড়ি": "string",
      "বিন্যাস": "any[]",
      "সংখ্যা_বিন্যাস": "number[]",
      "দড়ি_বিন্যাস": "string[]"
    };

    // Validate type
    const typeString = type.sourceString;
    if (!(typeString in tsTypeMap)) {
      throw new Error(`ত্রুটি: '${typeString}' কোন বৈধ ডাটা টাইপ নয়!`);
    }

    // Transliterate Bengali variable name
    const varName = transliterateBangla(name.sourceString);

    // Validate variable name (must start with a letter or _ and contain only alphanumeric characters or _)
    if (!varName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      throw new Error(`ত্রুটি: '${name.sourceString}' একটি অবৈধ ভেরিয়েবল নাম! ইংরেজি বর্ণমালা বা "_" ব্যবহার করুন।`);
    }

    return `let ${varName}: ${tsTypeMap[typeString]} = ${value.toTS()};`;
  },
  ArrayExpression(_open, elements, _close) {
    return `[${elements.children.map((e) => e.toTS()).join(", ")}]`;
  },

  // Fix: Corrected identifier function with proper arity
  identifier(_first, _rest) {
    return transliterateBangla(_first.sourceString + _rest.sourceString);
  },

  number(value) {
    return value.sourceString;
  },

  boolean(value) {
    return value.sourceString === "সত্য" ? "true" : "false";
  },

  string(_open, chars, _close) {
    return `"${chars.sourceString}"`;
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
