/**
 * Everything fictional about this starter lives here.
 *
 * Swapping the demo business for your own is meant to be one file. If you find
 * yourself editing a component to change a name, a headline, or a list item,
 * that content belongs in here instead.
 */

export const site = {
  name: "Northpath",
  tagline: "Field guides and templates for independent makers.",

  // The public homepage.
  hero: {
    heading: "Everything you need to run the business side of making things.",
    body: "Contracts, pricing worksheets, and project templates — written for people who would rather be doing the work than the paperwork.",
    cta: "Join for free",
  },

  // Shown on the marketing page as the reason to sign up.
  highlights: [
    "42 field guides, updated as things change",
    "Contract and invoice templates you can actually use",
    "New material every month",
  ],

  /**
   * What members get once they are signed in. This stands in for whatever your
   * real gated content is: courses, downloads, dashboards, client files.
   */
  resources: [
    {
      title: "The pricing worksheet",
      kind: "Template",
      body: "Work out a day rate you can defend, then sanity-check it against what you actually need to earn.",
    },
    {
      title: "Contracts without a lawyer",
      kind: "Field guide",
      body: "The five clauses that matter, in plain language, and what happens when you leave each one out.",
    },
    {
      title: "Scope, and how to hold it",
      kind: "Field guide",
      body: "How to write a scope that survives contact with a client, and what to say when it doesn't.",
    },
    {
      title: "Invoice pack",
      kind: "Template",
      body: "Four invoice formats, including the one that tends to get paid fastest.",
    },
  ],
};
