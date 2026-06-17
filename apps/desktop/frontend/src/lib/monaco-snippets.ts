// Curated snippet library, registered as Monaco completion items per
// language. Triggered by typing the prefix + Tab (or Enter on the
// suggestion). $1, $2 are tab-stops; ${1:placeholder} provides default
// text that the user can overwrite or tab past.
//
// Kept opinionated — about 8 snippets per language. The goal isn't
// VSCode parity, it's "students stop retyping boilerplate."

import type * as MonacoNS from "monaco-editor";

interface Snippet {
  prefix: string;
  body: string;
  description: string;
}

const HTML_SNIPPETS: Snippet[] = [
  {
    prefix: "html5",
    description: "HTML5 boilerplate (doctype + head + body)",
    body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>$1</title>
</head>
<body>
  $0
</body>
</html>`,
  },
  { prefix: "a",      description: "<a href> link",                     body: `<a href="\${1:url}">\${0:label}</a>` },
  { prefix: "img",    description: "<img> with alt",                    body: `<img src="\${1:src}" alt="\${2:description}" />` },
  { prefix: "form",   description: "<form> with submit button",         body: `<form action="\${1:/submit}" method="\${2|get,post|}">\n  $0\n  <button type="submit">Submit</button>\n</form>` },
  { prefix: "input",  description: "<input> labelled field",            body: `<label for="\${1:name}">\${2:Name}</label>\n<input id="\${1:name}" name="\${1:name}" type="\${3|text,email,password,number|}" />` },
  { prefix: "ul",     description: "<ul> with three <li>",              body: `<ul>\n  <li>$1</li>\n  <li>$2</li>\n  <li>$3</li>\n</ul>` },
  { prefix: "table",  description: "<table> with one header row",       body: `<table>\n  <thead>\n    <tr><th>$1</th><th>$2</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>$3</td><td>$4</td></tr>\n  </tbody>\n</table>` },
  { prefix: "script", description: "<script src> external JS",          body: `<script src="\${1:main.js}" defer></script>` },
  { prefix: "link",   description: "<link rel=stylesheet>",             body: `<link rel="stylesheet" href="\${1:styles.css}" />` },
];

const CSS_SNIPPETS: Snippet[] = [
  { prefix: "flex",    description: "Flex row, centered",         body: `display: flex;\nalign-items: center;\njustify-content: \${1|flex-start,center,space-between,space-around|};\ngap: \${2:1rem};` },
  { prefix: "flexcol", description: "Flex column, centered",      body: `display: flex;\nflex-direction: column;\nalign-items: \${1|stretch,center,flex-start|};\ngap: \${2:1rem};` },
  { prefix: "grid",    description: "CSS grid with auto-cols",    body: `display: grid;\ngrid-template-columns: repeat(\${1:auto-fit}, minmax(\${2:200px}, 1fr));\ngap: \${3:1rem};` },
  { prefix: "media",   description: "Media query for breakpoint", body: `@media (min-width: \${1:768px}) {\n  $0\n}` },
  { prefix: "hover",   description: "Hover with transition",      body: `transition: \${1|background-color,color,transform|} 200ms ease;\n\n&:hover {\n  $0\n}` },
  { prefix: "anim",    description: "@keyframes animation",       body: `@keyframes \${1:name} {\n  from { $2 }\n  to   { $3 }\n}` },
  { prefix: "var",     description: "CSS custom property",        body: `--\${1:name}: \${2:value};` },
  { prefix: "center",  description: "Absolute center pattern",    body: `position: absolute;\ntop: 50%;\nleft: 50%;\ntransform: translate(-50%, -50%);` },
];

const JS_SNIPPETS: Snippet[] = [
  { prefix: "fn",     description: "Function declaration",            body: `function \${1:name}(\${2:args}) {\n  $0\n}` },
  { prefix: "afn",    description: "Arrow function",                   body: `const \${1:name} = (\${2:args}) => {\n  $0\n};` },
  { prefix: "for",    description: "for-of loop",                      body: `for (const \${1:item} of \${2:items}) {\n  $0\n}` },
  { prefix: "fori",   description: "Classic indexed for",              body: `for (let i = 0; i < \${1:n}; i++) {\n  $0\n}` },
  { prefix: "await",  description: "async wrapper with try/catch",     body: `try {\n  const \${1:result} = await \${2:promise};\n  $0\n} catch (err) {\n  console.error(err);\n}` },
  { prefix: "trycatch", description: "try/catch block",                body: `try {\n  $1\n} catch (err) {\n  $0\n}` },
  { prefix: "fetch",  description: "fetch + json",                     body: `const res = await fetch("\${1:/api/endpoint}");\nif (!res.ok) throw new Error(\`HTTP \${res.status}\`);\nconst \${2:data} = await res.json();\n$0` },
  { prefix: "log",    description: "console.log labelled",             body: `console.log("\${1:label}:", \${2:value});` },
  { prefix: "iife",   description: "Immediately-invoked function",     body: `(() => {\n  $0\n})();` },
];

const REACT_SNIPPETS: Snippet[] = [
  {
    prefix: "useState",
    description: "useState pair",
    body: `const [\${1:value}, set\${1/(.)/\${1:/upcase}/}] = useState(\${2:initial});`,
  },
  {
    prefix: "useEffect",
    description: "useEffect with deps",
    body: `useEffect(() => {\n  $0\n}, [\${1:deps}]);`,
  },
  {
    prefix: "comp",
    description: "Function component skeleton",
    body: `export function \${1:Component}() {\n  return (\n    <div>\n      $0\n    </div>\n  );\n}`,
  },
  {
    prefix: "compprops",
    description: "Function component with props interface (TS)",
    body: `interface \${1:Component}Props {\n  \${2:prop}: \${3:string};\n}\n\nexport function \${1:Component}({ \${2:prop} }: \${1:Component}Props) {\n  return <div>{\${2:prop}}</div>;\n}`,
  },
  {
    prefix: "onClick",
    description: "onClick handler",
    body: `onClick={(\${1:e}) => {\n  $0\n}}`,
  },
  {
    prefix: "form",
    description: "Form with onSubmit",
    body: `<form onSubmit={(e) => {\n  e.preventDefault();\n  $0\n}}>\n  $1\n</form>`,
  },
];

const GO_SNIPPETS: Snippet[] = [
  { prefix: "fn",      description: "Function declaration",          body: `func \${1:name}(\${2:args}) \${3:returnType} {\n  $0\n}` },
  { prefix: "errcheck", description: "if err != nil block",          body: `if err != nil {\n  return \${1:err}\n}` },
  { prefix: "for",     description: "for-range loop",                body: `for \${1:i}, \${2:v} := range \${3:items} {\n  $0\n}` },
  { prefix: "main",    description: "main package skeleton",         body: `package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("$1")\n}` },
  { prefix: "struct",  description: "type Struct + json tags",       body: `type \${1:Name} struct {\n  \${2:Field} \${3:string} \\\`json:"\${2/(.*)/\${1:/downcase}/}"\\\`\n}` },
  { prefix: "iferr",   description: "shorthand err + handle",        body: `if \${1:val}, err := \${2:fn}(); err != nil {\n  return err\n} else {\n  $0\n}` },
];

const PYTHON_SNIPPETS: Snippet[] = [
  { prefix: "def",     description: "Function definition",           body: `def \${1:name}(\${2:args}):\n    $0` },
  { prefix: "main",    description: "if __name__ == '__main__'",     body: `if __name__ == "__main__":\n    $0` },
  { prefix: "class",   description: "Class with __init__",           body: `class \${1:Name}:\n    def __init__(self, \${2:args}):\n        self.\${2:args} = \${2:args}\n\n    def \${3:method}(self):\n        $0` },
  { prefix: "for",     description: "for-in loop",                   body: `for \${1:item} in \${2:items}:\n    $0` },
  { prefix: "trye",    description: "try/except block",              body: `try:\n    $1\nexcept \${2:Exception} as e:\n    $0` },
];

const BY_LANGUAGE: Record<string, Snippet[]> = {
  html:       HTML_SNIPPETS,
  css:        CSS_SNIPPETS,
  scss:       CSS_SNIPPETS,
  less:       CSS_SNIPPETS,
  javascript: [...JS_SNIPPETS, ...REACT_SNIPPETS],
  typescript: [...JS_SNIPPETS, ...REACT_SNIPPETS],
  go:         GO_SNIPPETS,
  python:     PYTHON_SNIPPETS,
};

export function registerSnippets(monaco: typeof MonacoNS) {
  for (const [lang, snippets] of Object.entries(BY_LANGUAGE)) {
    monaco.languages.registerCompletionItemProvider(lang, {
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range: MonacoNS.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        return {
          suggestions: snippets.map((s) => ({
            label: s.prefix,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.body,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: { value: "```" + (lang === "css" ? "css" : lang) + "\n" + s.body.replace(/\$\d+|\$\{[^}]+\}/g, "") + "\n```" },
            detail: s.description,
            range,
          })),
        };
      },
    });
  }
}
