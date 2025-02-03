import * as ohm from 'ohm-js';

const statementsGrammar = `
  Statements {
    Statement = PrintStatement | VariableDeclaration

    PrintStatement = "দেখাও" "(" string ")" ";"
    VariableDeclaration = "ধরি" Identifier "=" Expression ";"

    Expression = "সত্য" | "মিথ্যা" | string | number
    string = "\\"" (~"\\"" any)* "\\""
    number = digit+
    Identifier = letter (letter | digit)*
  }
`;

export const Statements = ohm.grammar(statementsGrammar);
export const statementsSemantics = Statements.createSemantics();

statementsSemantics.addOperation('toTS()', {
  Statement(stmt) { return stmt.toTS(); },
  PrintStatement(_write, _open, str, _close, _semi) {
    return `console.log(${str.toTS()});`;
  },
  VariableDeclaration(_let, name, _eq, value, _semi) {
    return `let ${name.sourceString} = ${value.toTS()};`;
  },
  string(_open, chars, _close) {
    return `"${chars.sourceString}"`;
  },
  number(n) {
    return n.sourceString;
  }
});
