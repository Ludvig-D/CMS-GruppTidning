import Page from '@/components/Page';
import Feature from '@/components/Feature';
import Grid from '@/components/Grid';
import Teaser from '@/components/Teaser';
import AuthorBlock from '@/components/blocks/AuthorBlock';
import ArticleBlock from '@/components/blocks/ArticleBlock';
import CategoryBlock from '@/components/blocks/CategoryBlock';
import ConfigBlock from '@/components/blocks/ConfigBlock';
import FilteredPosts from '@/components/FilteredPosts';
import NavLink from '@/components/blocks/NavLink';
import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

// Draft content is only fetched in dev, so a leaked delivery token never exposes
// unpublished drafts in production (see README's Vercel deploy checklist for the
// matching token requirement).
export const SB_VERSION = process.env.NODE_ENV === 'production' ? 'published' : 'draft';

export const getStoryblokApi = storyblokInit({
	accessToken: process.env.STORYBLOK_DELIVERY_API_TOKEN,
	use: [apiPlugin],
	components: {
		page: Page,
		feature: Feature,
		grid: Grid,
		teaser: Teaser,
		author: AuthorBlock,
		article: ArticleBlock,
		category: CategoryBlock,
		config: ConfigBlock,
		'filtered-posts': FilteredPosts,
		'nav-link': NavLink,
	},
	apiOptions: {
		/** Set the correct region for your space. Learn more: https://www.storyblok.com/docs/packages/storyblok-js#example-region-parameter */
		region: process.env.STORYBLOK_REGION || 'eu',
		/** The following code is only required when creating a Storyblok space directly via the Blueprints feature. */
		endpoint: process.env.STORYBLOK_API_BASE_URL
			? `${new URL(process.env.STORYBLOK_API_BASE_URL).origin}/v2`
			: undefined,
	},
});
