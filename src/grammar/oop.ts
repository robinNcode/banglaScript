import * as ohm from "ohm-js";
import { transliterateBangla } from "./transliterate";
import transpileVariables from "./variables";  // For variable declaration in OOP
import transpileStatements from "./statements"; // Importing statements
import transpileConditionals from "./conditionals"; // Importing conditionals
import transpileLoops from "./loops"; // Importing loops

const oopGrammar = `
  OOP {
    OOPStatement = ClassDeclaration | ObjectInstantiation | MethodCall

    ClassDeclaration = "শ্রেণী" identifier "{" VariableDeclaration* ConstructorDeclaration? MethodDeclaration* "}"
    ConstructorDeclaration = "নির্মাতা" "(" ParameterList? ")" Block
    MethodDeclaration = "পদ্ধতি" identifier "(" ParameterList? ")" Block
    ObjectInstantiation = identifier "=" "নতুন" identifier "(" ArgumentList? ")" ";"
    MethodCall = identifier "." identifier "(" ArgumentList? ")" ";"

    ParameterList = identifier ("," identifier)*
    ArgumentList = Expression ("," Expression)*

    Block = "{" Statement* "}"
    Statement = VariableDeclaration | Assignment | MethodCall | PrintStatement | ConditionalStatement | LoopStatement

    VariableDeclaration = VarType identifier "=" Expression ";"
    VarType = "সংখ্যা" | "হাছামিছা" | "দড়ি" | "বিন্যাস"
    Expression = number | boolean | string | identifier

    Assignment = identifier "=" Expression ";"

    identifier = letter (letter | digit)*
    number = digit+
    boolean = "সত্য" | "মিথ্যা"
    PrintStatement = "দেখাও" "(" string ")" ";"
    string = "\\"" (~"\\"" any)* "\\""
    
    ConditionalStatement = যদি "(" Expression ")" Block "নয়তো" Block
    LoopStatement = "যতদিন" "(" Expression ")" Block
  }
`;

const OOP = ohm.grammar(oopGrammar);
const semantics = OOP.createSemantics();

/**
 * Semantic rules for OOP
 */
semantics.addOperation("toTS()", {
  ClassDeclaration(_class, name, _open, variables, constructor, methods, _close) {
    // Handling class variables (properties) using transpileVariables
    const classVariables = variables.children.map(v => transpileVariables(v)).join("\n");

    return `class ${transliterateBangla(name.sourceString)} {\n${classVariables}\n${constructor.toTS()}${methods.children.map(m => m.toTS()).join("\n")}\n}`;
  },

  ConstructorDeclaration(_constructor, _open, params, _close, block) {
    return `constructor(${params ? params.toTS() : ""}) ${block.toTS()}`;
  },

  MethodDeclaration(_method, name, _open, params, _close, block) {
    return `${transliterateBangla(name.sourceString)}(${params ? params.toTS() : ""}) ${block.toTS()}`;
  },

  ObjectInstantiation(name, _eq, _new, className, _open, args, _close, _semicolon) {
    return `let ${transliterateBangla(name.sourceString)} = new ${transliterateBangla(className.sourceString)}(${args ? args.toTS() : ""});`;
  },

  MethodCall(object, _dot, method, _open, args, _close, _semicolon) {
    return `${transliterateBangla(object.sourceString)}.${transliterateBangla(method.sourceString)}(${args ? args.toTS() : ""});`;
  },

  VariableDeclaration(type, name, _eq, value, _semicolon) {
    return transpileVariables(type, name, _eq, value, _semicolon); // Using transpileVariables
  },

  ParameterList(first, rest) {
    return [transliterateBangla(first.sourceString), ...rest.children.map(p => transliterateBangla(p.sourceString))].join(", ");
  },

  ArgumentList(first, rest) {
    return [first.toTS(), ...rest.children.map(a => a.toTS())].join(", ");
  },

  Block(_open, statements, _close) {
    return `{\n${statements.children.map(s => transpileStatements(s)).join("\n")}\n}`;
  },

  PrintStatement(_print, _open, str, _close, _semicolon) {
    return transpileStatements(_print, _open, str, _close, _semicolon); // Using transpileStatements
  },

  string(_open, chars, _close) {
    return `"${chars.sourceString}"`;
  },

  ConditionalStatement(_if, _openParen, condition, _closeParen, ifBlock, _else, elseBlock) {
    return transpileConditionals(_if, _openParen, condition, _closeParen, ifBlock, _else, elseBlock);
  },

  LoopStatement(_while, _openParen, condition, _closeParen, block) {
    return transpileLoops(_while, _openParen, condition, _closeParen, block);
  }
});

/**
 * Function to transpile BanglaScript OOP to TypeScript
 * @param code - BanglaScript code
 */
export default function transpileOOP(code: string): string {
  const matchResult = OOP.match(code);
  if (matchResult.failed()) {
    throw new Error("Syntax Error in OOP statement: " + matchResult.message);
  }
  return semantics(matchResult).toTS();
}
