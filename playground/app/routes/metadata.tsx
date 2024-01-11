import {
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const schema = z.object({
	title: z.string({ required_error: 'Title is required' }),
	bookmarks: z
		.object({
			name: z.string({ required_error: 'Name is required' }),
			url: z
				.string({ required_error: 'Url is required' })
				.url('Url is invalid'),
		})
		.array()
		.refine(
			(bookmarks) =>
				new Set(bookmarks.map((bookmark) => bookmark.url)).size ===
				bookmarks.length,
			'Bookmark URLs are repeated',
		),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(submission.reply());
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		id: 'example',
		lastResult,
		defaultValue: {
			bookmarks: [{}, {}],
		},
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});
	const bookmarks = fields.bookmarks.getFieldList();

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground
				title="Metadata"
				result={{
					form: {
						status: form.status,
						initialValue: form.initialValue,
						value: form.value,
						dirty: form.dirty,
						valid: form.valid,
						errors: form.errors,
						allValid: form.allValid,
						allErrors: form.allErrors,
					},
					title: {
						initialValue: fields.title.initialValue,
						value: fields.title.value,
						dirty: fields.title.dirty,
						valid: fields.title.valid,
						errors: fields.title.errors,
						allValid: fields.title.allValid,
						allErrors: fields.title.allErrors,
					},
					bookmarks: {
						initialValue: fields.bookmarks.initialValue,
						value: fields.bookmarks.value,
						dirty: fields.bookmarks.dirty,
						valid: fields.bookmarks.valid,
						errors: fields.bookmarks.errors,
						allValid: fields.bookmarks.allValid,
						allErrors: fields.bookmarks.allErrors,
					},
					'bookmarks[0]': {
						initialValue: bookmarks[0]?.initialValue,
						value: bookmarks[0]?.value,
						dirty: bookmarks[0]?.dirty,
						valid: bookmarks[0]?.valid,
						errors: bookmarks[0]?.errors,
						allValid: bookmarks[0]?.allValid,
						allErrors: bookmarks[0]?.allErrors,
					},
					'bookmarks[1]': {
						initialValue: bookmarks[1]?.initialValue,
						value: bookmarks[1]?.value,
						dirty: bookmarks[1]?.dirty,
						valid: bookmarks[1]?.valid,
						errors: bookmarks[1]?.errors,
						allValid: bookmarks[1]?.allValid,
						allErrors: bookmarks[1]?.allErrors,
					},
				}}
			>
				<Field label="Title" meta={fields.title}>
					<input {...getInputProps(fields.title)} />
				</Field>
				<Alert id={fields.bookmarks.errorId} errors={fields.bookmarks.errors} />
				{bookmarks.map((bookmark, index) => {
					const { name, url } = bookmark.getFieldset();

					return (
						<fieldset key={bookmark.key} {...getFieldsetProps(bookmark)}>
							<legend className="mt-2 mb-4">Bookmark #{index + 1}</legend>
							<Field label="Name" meta={name}>
								<input {...getInputProps(name)} />
							</Field>
							<Field label="Url" meta={url}>
								<input {...getInputProps(url)} />
							</Field>
						</fieldset>
					);
				})}
			</Playground>
		</Form>
	);
}
