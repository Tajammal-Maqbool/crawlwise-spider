export interface RichResultRule {
  feature: string
  required: Array<string | string[]>
  recommended: string[]
}

// Based on Google Search Central structured data documentation. An inner array means "at least one of".
const ARTICLE: RichResultRule = { feature: 'Article', required: [], recommended: ['headline', 'image', 'datePublished', 'dateModified', 'author'] }

export const RICH_RESULT_RULES: Record<string, RichResultRule> = {
  Article: ARTICLE,
  NewsArticle: ARTICLE,
  BlogPosting: ARTICLE,
  Product: { feature: 'Product Snippets', required: ['name', ['review', 'aggregateRating', 'offers']], recommended: ['image', 'description', 'sku', 'brand'] },
  BreadcrumbList: { feature: 'Breadcrumbs', required: ['itemListElement'], recommended: [] },
  FAQPage: { feature: 'FAQ', required: ['mainEntity'], recommended: [] },
  QAPage: { feature: 'Q&A', required: ['mainEntity'], recommended: [] },
  HowTo: { feature: 'How-to', required: ['name', 'step'], recommended: ['image', 'totalTime', 'supply', 'tool'] },
  Recipe: {
    feature: 'Recipes',
    required: ['name', 'image'],
    recommended: ['aggregateRating', 'author', 'cookTime', 'datePublished', 'description', 'keywords', 'nutrition', 'prepTime', 'recipeCategory', 'recipeCuisine', 'recipeIngredient', 'recipeInstructions', 'recipeYield', 'totalTime']
  },
  Event: { feature: 'Events', required: ['name', 'startDate', 'location'], recommended: ['description', 'endDate', 'eventAttendanceMode', 'eventStatus', 'image', 'offers', 'organizer', 'performer'] },
  JobPosting: {
    feature: 'Job Postings',
    required: ['datePosted', 'description', 'hiringOrganization', 'jobLocation', 'title'],
    recommended: ['applicantLocationRequirements', 'baseSalary', 'employmentType', 'identifier', 'jobLocationType', 'validThrough']
  },
  LocalBusiness: { feature: 'Local Business', required: ['address', 'name'], recommended: ['aggregateRating', 'geo', 'openingHoursSpecification', 'priceRange', 'review', 'telephone', 'url'] },
  Organization: { feature: 'Organization', required: [], recommended: ['logo', 'url', 'name'] },
  VideoObject: { feature: 'Videos', required: ['name', 'thumbnailUrl', 'uploadDate'], recommended: ['contentUrl', 'description', 'duration', 'embedUrl'] },
  Review: { feature: 'Review Snippets', required: ['author', 'itemReviewed', 'reviewRating'], recommended: ['datePublished'] },
  Course: { feature: 'Course Info', required: ['name', 'description'], recommended: ['provider', 'offers'] },
  SoftwareApplication: { feature: 'Software App', required: ['name', 'offers', ['aggregateRating', 'review']], recommended: ['applicationCategory', 'operatingSystem'] },
  Dataset: { feature: 'Datasets', required: ['name', 'description'], recommended: ['url', 'creator', 'license'] }
}
