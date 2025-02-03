import * as ohm from 'ohm-js';
import { transliterateBangla } from "./transliterate.ts";

/**
 * Define Ohm grammar for variable declarations in BanglaScript
 */
const variableGrammar = `
Variables {
  Program = Statement*
  Statement = VariableDeclaration

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
 * Create a new Ohm grammar
 */
const Variables = ohm.grammar(variableGrammar);
const semantics = Variables.createSemantics();

/**
 * Define semantics for variable declarations
 */
semantics.addOperation('toTS()', {
  Program(statements) {
    return statements.children.map((s) => s.toTS()).join("\n");
  },

  VariableDeclaration(_dhori, type, name, _eq, value, _semicolon) {
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

  identifier(name) {
    return transliterateBangla(name.sourceString);
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
 * Function to transpile BanglaScript variable declaration to TypeScript
 */
export default function transpileVariables(code: string): string {
  const matchResult = Variables.match(code);
  if (matchResult.failed()) {
    throw new Error("ত্রুটি: " + matchResult.message);
  }
  return semantics(matchResult).toTS();
}
