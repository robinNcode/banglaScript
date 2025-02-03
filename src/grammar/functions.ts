import * as ohm from 'ohm-js';
import { transliterateBangla } from "./transliterate.ts";
import transpileVariables from "./variables.ts";

/**
 * Define Ohm grammar for function declarations in BanglaScript
 */
const functionGrammar = `
Functions {
  Program = FunctionDeclaration*
  FunctionDeclaration = "কাঠামো" identifier "(" ParamList? ")" "{" Statement* "}"
  ParamList = ListOf<Param, ",">
  Param = VarType identifier
  Statement = ReturnStatement | VariableDeclaration
  ReturnStatement = "ফেরত" Expression ";"
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

const Functions = ohm.grammar(functionGrammar);
const semantics = Functions.createSemantics();

semantics.addOperation('toTS()', {
  Program(functions) {
    return functions.children.map((f) => f.toTS()).join("\n\n");
  },

  FunctionDeclaration(_fn, name, _open, params, _close, _openBrace, statements, _closeBrace) {
    const fnName = transliterateBangla(name.sourceString);

    if (!fnName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      throw new Error(`ত্রুটি: '${name.sourceString}' একটি অবৈধ ফাংশন নাম! ইংরেজি বর্ণমালা বা "_" ব্যবহার করুন।`);
    }

    const paramList = params.numChildren ? params.toTS() : "";
    const body = statements.children.map((s) => s.toTS()).join("\n  ");

    return `function ${fnName}(${paramList}) {\n  ${body}\n}`;
  },

  ParamList(params) {
    return params.children.map((p) => p.toTS()).join(", ");
  },

  Param(type, name) {
    const tsType = getTypeMapping(type.sourceString);
    const paramName = transliterateBangla(name.sourceString);

    if (!paramName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      throw new Error(`ত্রুটি: '${name.sourceString}' একটি অবৈধ প্যারামিটার নাম! ইংরেজি বর্ণমালা বা "_" ব্যবহার করুন।`);
    }

    return `${paramName}: ${tsType}`;
  },

  ReturnStatement(_return, expr, _semicolon) {
    return `return ${expr.toTS()};`;
  },

  VariableDeclaration(_dhori, type, name, _eq, value, _semicolon) {
    return transpileVariables(type, name, _eq, value, _semicolon);
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

function getTypeMapping(type: string): string {
  const tsTypeMap: Record<string, string> = {
    "সংখ্যা": "number",
    "হাছামিছা": "boolean",
    "দড়ি": "string",
    "বিন্যাস": "any[]",
    "সংখ্যা_বিন্যাস": "number[]",
    "দড়ি_বিন্যাস": "string[]"
  };

  if (!(type in tsTypeMap)) {
    throw new Error(`ত্রুটি: '${type}' কোন বৈধ ডাটা টাইপ নয়!`);
  }

  return tsTypeMap[type];
}


export default function transpileFunctions(code: string): string {
  const matchResult = Functions.match(code);
  if (matchResult.failed()) {
    throw new Error("ত্রুটি: " + matchResult.message);
  }
  return semantics(matchResult).toTS();
}
