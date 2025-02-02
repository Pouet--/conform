import type { Endpoints } from '@octokit/types';
import type { AppLoadContext } from '@remix-run/cloudflare';

export function invariant(
	expectedCondition: boolean,
	message: string,
): asserts expectedCondition {
	if (!expectedCondition) {
		throw new Error(message);
	}
}

export function getMetadata(context: AppLoadContext) {
	return {
		owner: 'edmundhung',
		repo: 'conform',
		ref: getBranch(context),
	};
}

export function getEnv(context: AppLoadContext) {
	return context.env;
}

export function getGitHubToken(context: AppLoadContext): string | undefined {
	return context.env.GITHUB_ACCESS_TOKEN;
}

export function getBranch(context: AppLoadContext): string {
	return context.env.CF_PAGES_BRANCH ?? 'main';
}

export function getCache(context: AppLoadContext): KVNamespace {
	return context.env.CACHE;
}

export async function getFileContent(
	context: AppLoadContext,
	path: string,
): Promise<string> {
	const { ref, owner, repo } = getMetadata(context);
	const cache = getCache(context);
	const cacheKey = `${ref}/${path}`;

	let content = await cache.get(cacheKey);

	if (!content) {
		const auth = getGitHubToken(context);
		const file = await downloadFile({
			auth,
			ref,
			path,
			owner,
			repo,
		});

		content = atob(file.content);
		context.waitUntil(
			cache.put(cacheKey, content, {
				expirationTtl: 3600,
			}),
		);
	}

	return content;
}

export function getGitHubApiHeaders(auth: string | undefined) {
	const headers = new Headers({
		Accept: 'application/vnd.github+json',
		'User-Agent': 'Conform Guide',
	});

	if (auth) {
		headers.set('Authorization', `Bearer ${auth}`);
	}

	return headers;
}

export async function downloadFile(options: {
	auth?: string;
	ref?: string;
	path: string;
	owner: string;
	repo: string;
}) {
	try {
		const resposne = await fetch(
			`https://api.github.com/repos/${options.owner}/${options.repo}/contents/${options.path}?ref=${options.ref}`,
			{
				headers: getGitHubApiHeaders(options.auth),
			},
		);
		const file: Endpoints['GET /repos/{owner}/{repo}/contents/{path}']['response']['data'] =
			await resposne.json();

		if (Array.isArray(file) || file.type !== 'file') {
			throw new Error('The path provided should be pointed to a file');
		}

		return file;
	} catch (e) {
		if ((e as any).status === 404) {
			throw notFound();
		}

		throw e;
	}
}

export function formatTitle(title: string | undefined): string {
	return title ? `Conform / ${title}` : 'Conform Guide';
}

export function notFound() {
	return new Response('Not found', { status: 404, statusText: 'Not Found' });
}

export const logo = [
	' ███████╗  ██████╗  ███╗  ██╗ ████████╗  ██████╗  ███████╗  ███╗ ███╗',
	'██╔═════╝ ██╔═══██╗ ████╗ ██║ ██╔═════╝ ██╔═══██╗ ██╔═══██╗ ████████║',
	'██║       ██║   ██║ ██╔██╗██║ ███████╗  ██║   ██║ ███████╔╝ ██╔██╔██║',
	'██║       ██║   ██║ ██║╚████║ ██╔════╝  ██║   ██║ ██╔═══██╗ ██║╚═╝██║',
	'╚███████╗ ╚██████╔╝ ██║ ╚███║ ██║       ╚██████╔╝ ██║   ██║ ██║   ██║',
	' ╚══════╝  ╚═════╝  ╚═╝  ╚══╝ ╚═╝        ╚═════╝  ╚═╝   ╚═╝ ╚═╝   ╚═╝',
].join('\n');
