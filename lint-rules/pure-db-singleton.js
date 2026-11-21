// A module's `.server.ts` entry point exports one instance built around `db`:
// `export const catalog = createCatalog(db)`. A route imports that file for
// its loader, and without `/* @__PURE__ */` the bundler cannot drop the call
// from the client build, so the database comes along into the browser.

const isPure = (sourceCode, node) =>
  sourceCode
    .getCommentsBefore(node)
    .some((comment) => comment.value.includes("@__PURE__"));

const passesDb = (call) =>
  call.arguments.some((arg) => arg.type === "Identifier" && arg.name === "db");

const pureDbSingleton = {
  meta: {
    type: "problem",
    messages: {
      impure:
        "Mark this call /* @__PURE__ */ so a loader import does not pull the database into the client bundle.",
    },
  },
  create(context) {
    if (!/\.server\.tsx?$/.test(context.filename)) return {};
    return {
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator"(
        node
      ) {
        const init = node.init;
        if (!init || init.type !== "CallExpression" || !passesDb(init)) return;
        if (isPure(context.sourceCode, init)) return;
        context.report({ node: init, messageId: "impure" });
      },
    };
  },
};

export default {
  meta: { name: "bundle" },
  rules: { "pure-db-singleton": pureDbSingleton },
};
