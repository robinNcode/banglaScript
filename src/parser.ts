import * as ohm from 'ohm-js';
import {transliterateBangla} from './utils/transliterate';

// Define the BanglaScript grammar
const banglaGrammar = `
  BanglaScript {
    Program = Statement*
    Statement = PrintStatement | VariableDeclaration

    PrintStatement = "দেখাও" "(" outputString ")" ";"
    VariableDeclaration = VarKeyword ~" " VarType ~" " (identifier | bengaliIdentifier) ~" " "=" ~" " Expression ";"

    VarKeyword = "ধরি" | "ধ্রুবক" | "চলক"
    VarType = "সংখ্যা" | "হাছামিছা" | "দড়ি" | "বিন্যাস" | "সংখ্যা_বিন্যাস" | "দড়ি_বিন্যাস"

    Expression = String | Number | Boolean | identifier
    String = "\\"" chars "\\""
    chars = (~"\\"" any)*
    Number = digit+ ("." digit+)?  -- withDecimal
       | digit+                -- withoutDecimal

    Boolean = "সত্য" | "মিথ্যা"
    
    bengaliLetters = "অ" | "আ" | "ই" | "ঈ" | "উ" | "ঊ" | "ঋ" | "এ" | "ঐ" | "ও" | "ঔ" | "ক" | "খ" | "গ" | "ঘ" | "ঙ" | "চ" | "ছ" | "জ" | "ঝ" | "ঞ" 
          | "ট" | "ঠ" | "ড" | "ঢ" | "ণ" | "ত" | "থ" | "দ" | "ধ" | "ন" | "প" | "ফ" | "ব" | "ভ" | "ম" | "য" | "র" | "ল" | "শ" | "ষ" 
          | "স" | "হ" | "ক্ষ" | "ড়" | "ঢ়" | "য়" | "ৄ" | "ৢ" | "ৣ" | "ৎ" | "ং" | "ঃ" | "ঁ" | "ঽ" | "অঁ"
    bengaliDigit = "০" | "১" | "২" | "৩" | "৪" | "৫" | "৬" | "৭" | "৮" | "৯" 
    bengaliIdentifier = bengaliLetters (bengaliLetters | bengaliDigit | "_")*
    
    identifier = letter (letter | digit)*
    
    outputString = "\\"" chars "\\"" -- string 
      | letter (letter | digit)* -- identifier
      | bengaliLetters (bengaliLetters | bengaliDigit | "_")* -- bengaliIdentifier
  }
`;

// Create the grammar and semantics
const BanglaScript = ohm.grammar(banglaGrammar);
const semantics = BanglaScript.createSemantics();

// Define the semantics of the grammar
semantics.addOperation('toTS()', {
  Program(statements) {
    return statements.children.map((s) => s.toTS()).join("\n");
  },

  Statement(stmt) {
    return stmt.toTS();
  },

  // PrintStatement now handles the outputString rule properly
  PrintStatement(_write, _openParen, str, _closeParen, _semicolon) {
    return `console.log(${str.toTS()});`;
  },

  VariableDeclaration(varKeyword, varType, id, _eq, expr, _semicolon) {
    const jsKeyword = {
      "ধরি": "let",
      "ধ্রুবক": "const",
      "চলক": "var"
    }[varKeyword.sourceString];

    const jsType = {
      "সংখ্যা": "number",
      "হাছামিছা": "boolean",
      "দড়ি": "string",
      "বিন্যাস": "any[]",
      "সংখ্যা_বিন্যাস": "number[]",
      "দড়ি_বিন্যাস": "string[]"
    }[varType.sourceString];

    // Check if the identifier is Bengali or not
    const tsVarName = (id.sourceString.match(/^[\u0980-\u09FF]+$/)) ? transliterateBangla(id.sourceString) : id.sourceString;

    const tsExpr = expr.toTS();

    return `${jsKeyword} ${tsVarName}: ${jsType} = ${tsExpr};`;
  },

  // Handle outputString as either a string literal or an identifier
  outputString_string(_openQuote, chars, _closeQuote) {
    return `"${chars.sourceString}"`; // Preserve quotes for string output
  },
  outputString_identifier(firstChar, restChars) {
    return transliterateBangla(firstChar.sourceString + restChars.sourceString);
  },
  outputString_bengaliIdentifier(firstChar, restChars) {
    return transliterateBangla(firstChar.sourceString + restChars.sourceString);
  },

  // String handling (keeping as it is)
  String(_open, chars, _close) {
    // Manually handling escaping here
    return `"${chars.sourceString.replace(/\\"/g, '"')}"`;
  },

  // Number with decimal
  Number_withDecimal(intPart, _dot, decimalPart) {
    return intPart.sourceString + "." + decimalPart.sourceString;
  },

  // Number without decimal
  Number_withoutDecimal(intPart) {
    return intPart.sourceString;
  },

  // Boolean handling
  Boolean(bool) {
    return bool.sourceString === "সত্য" ? "true" : "false";
  },

  // Identifier handling (Transliterate Bangla identifiers)
  identifier(firstChar, restChars) {
    return transliterateBangla(firstChar.sourceString + restChars.sourceString);
  },

  // Handling characters in strings
  chars(chars) {
    return chars.sourceString;
  }
});

// Function to transpile BanglaScript to TypeScript
export default function transpileBanglaScript(code: string): string {
  const matchResult = BanglaScript.match(code);
  if (matchResult.failed()) {
    throw new Error("Syntax Error: " + matchResult.message);
  }
  return semantics(matchResult).toTS();
}
