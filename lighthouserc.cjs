module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/',
        'http://localhost/grupe/',
        'http://localhost/metoda-cambridge/',
        'http://localhost/test-de-nivel/',
        'http://localhost/lectie-demo/',
        'http://localhost/tabere/',
        'http://localhost/blog/',
        'http://localhost/confidentialitate/',
        'http://localhost/cookies/',
        'http://localhost/termeni/',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
};
