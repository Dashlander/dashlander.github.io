import { Resvg } from "@resvg/resvg-js";
import type { APIContext, InferGetStaticPropsType } from "astro";
import satori, { type SatoriOptions } from "satori";
import { html } from "satori-html";
import RobotoMonoBold from "@/assets/roboto-mono-700.ttf";
import RobotoMono from "@/assets/roboto-mono-regular.ttf";
import { getAllPosts } from "@/data/post";
import { siteConfig } from "@/site.config";
import { getFormattedDate } from "@/utils/date";

const ogOptions: SatoriOptions = {
	// debug: true,
	fonts: [
		{
			data: Buffer.from(RobotoMono),
			name: "Roboto Mono",
			style: "normal",
			weight: 400,
		},
		{
			data: Buffer.from(RobotoMonoBold),
			name: "Roboto Mono",
			style: "normal",
			weight: 700,
		},
	],
	height: 630,
	width: 1200,
};

const markup = (title: string, subtitle: string) =>
html`<div tw="flex flex-col w-full h-full bg-[#1a1826] text-[#c8c4dc]">
        <div tw="flex flex-col flex-1 w-full p-10 justify-center">
            <p tw="text-2xl mb-6 text-[#8b85b8]">${subtitle}</p>
            <h1 tw="text-6xl font-bold leading-snug text-[#f0eeff]">${title}</h1>
        </div>
        <div tw="flex items-center justify-between w-full p-10 border-t border-[#6b65a8] text-xl">
            <div tw="flex items-center">
                <svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
                    <path
                        fill="#2E4A6A"
                        d="M200 86.5 349.5 236 200 385.5 50.5 236z"
                    />
                    <path
                        fill="#4A7FA8"
                        d="M126 132.5h148.5l75 75-75 75H126l-75-75z"
                    />
                    <path
                        fill="#DAEAF5"
                        d="M126 174h148.5v148.5H126z"
                    />
                </svg>
                <p tw="ml-3 font-semibold">${siteConfig.title}</p>
            </div>
            <p>by ${siteConfig.author}</p>
        </div>
    </div>`;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
	const { subtitle, title } = context.props as Props;
	const svg = await satori(markup(title, subtitle), ogOptions);
	const pngBuffer = new Resvg(svg).render().asPng();
	const png = new Uint8Array(pngBuffer);
	return new Response(png, {
		headers: {
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": "image/png",
		},
	});
}

export async function getStaticPaths() {
	const posts = await getAllPosts();

	const postPaths = posts
		.filter(({ data }) => !data.ogImage)
		.map((post) => ({
			params: { slug: post.id },
			props: {
				title: post.data.title,
				subtitle: getFormattedDate(post.data.updatedDate ?? post.data.publishDate, {
					month: "long",
					weekday: "long",
				}),
			},
		}));

	const staticPaths = [
		{ slug: "home", 	title: "Home", 				subtitle: siteConfig.description },
		{ slug: "about",   	title: "About",          	subtitle: "A little something about me" },
		{ slug: "posts",   	title: "Blog",            	subtitle: "Latest posts from my blog" },
		{ slug: "notes",   	title: "Notes",           	subtitle: "a unfiltered stream of thoughts" },
		{ slug: "resume",  	title: "Resume",          	subtitle: "My Resume, and professional experiences" },
		{ slug: "sitemap", 	title: "Site Index",      	subtitle: "Browse all available pages" },
		{ slug: "tags",    	title: "All Tags",        	subtitle: "Filter by topic" },
		{ slug: "404",     	title: "Page Not Found",  	subtitle: "The page you're looking for doesn't exist" },
	].map(({ slug, title, subtitle }) => ({
		params: { slug },
		props: { title, subtitle },
	}));

	return [...postPaths, ...staticPaths];
}