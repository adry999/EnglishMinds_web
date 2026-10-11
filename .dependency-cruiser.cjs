/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'feature-to-other-feature',
      comment: 'Un feature nu importă alt feature; comunică prin CustomEvent din shared/contracts.',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/', pathNot: '^src/features/$1/' },
    },
    {
      name: 'model-must-be-pure',
      comment: 'model/ nu importă UI, rețea sau Astro.',
      severity: 'error',
      from: { path: '^src/features/[^/]+/model/' },
      to: { path: ['^src/features/[^/]+/(ui|api|diploma)/', '\\.astro$', '^node_modules/astro/'] },
    },
    {
      name: 'pages-use-feature-index',
      comment: 'Paginile și layout-urile intră într-un feature doar prin index.ts.',
      severity: 'error',
      from: { path: '^src/(pages|layouts)/' },
      to: { path: '^src/features/[^/]+/', pathNot: '^src/features/[^/]+/index\\.ts$' },
    },
    {
      name: 'feature-not-to-app',
      comment: 'Un feature nu depinde de pagini sau layout-uri.',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: '^src/(pages|layouts)/' },
    },
    {
      name: 'shared-core-are-leaves',
      comment: 'shared/ și core/ nu depind de feature-uri sau de pagini.',
      severity: 'error',
      from: { path: '^src/(shared|core)/' },
      to: { path: '^src/(features|pages|layouts)/' },
    },
    {
      name: 'server-only-contracts',
      comment: 'server/ importă din src/ doar shared/contracts/.',
      severity: 'error',
      from: { path: '^server/' },
      to: { path: '^src/', pathNot: '^src/shared/contracts/' },
    },
    {
      name: 'src-not-to-server',
      comment: 'src/ nu importă din server/.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^server/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
  },
};
