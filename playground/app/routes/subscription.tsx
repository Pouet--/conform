import {
	type FieldName,
	type FormId,
	type FieldMetadata,
	type FormMetadata,
	getFormProps,
	getInputProps,
	useField,
	useForm,
	useFormMetadata,
	FormProvider,
	getTextareaProps,
	control,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { memo, useRef } from 'react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z
	.object({
		name: z.string({ required_error: 'Name is required' }),
		message: z.string({ required_error: 'Message is required' }),
	})
	.superRefine((value, ctx) => {
		if (!value.message.startsWith(`Hello ${value.name}`)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Please start with Hello ${value.name}`,
			});
		}
	});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
		isStrcitMode: Boolean(process.env.CI),
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, {
		schema,
	});

	return json(submission.reply());
}

export default function Example() {
	const { noClientValidate, isStrcitMode: strict } =
		useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		id: 'example',
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});
	const name = fields.name.name;
	const message = fields.message.name;
	const description = (
		<ul className="space-y-1 list-disc">
			<FormMetadata strict={strict} formId={form.id} subject="initialValue" />
			<FormMetadata strict={strict} formId={form.id} subject="value" />
			<FormMetadata strict={strict} formId={form.id} subject="key" />
			<FormMetadata strict={strict} formId={form.id} subject="dirty" />
			<FormMetadata strict={strict} formId={form.id} subject="valid" />
			<FormMetadata strict={strict} formId={form.id} subject="allValid" />
			<FormMetadata strict={strict} formId={form.id} subject="errors" />
			<FormMetadata strict={strict} formId={form.id} subject="allErrors" />
			<FieldMetadata strict={strict} name={name} subject="initialValue" />
			<FieldMetadata strict={strict} name={name} subject="value" />
			<FieldMetadata strict={strict} name={name} subject="key" />
			<FieldMetadata strict={strict} name={name} subject="dirty" />
			<FieldMetadata strict={strict} name={name} subject="valid" />
			<FieldMetadata strict={strict} name={name} subject="errors" />
			<FieldMetadata strict={strict} name={message} subject="initialValue" />
			<FieldMetadata strict={strict} name={message} subject="value" />
			<FieldMetadata strict={strict} name={message} subject="key" />
			<FieldMetadata strict={strict} name={message} subject="dirty" />
			<FieldMetadata strict={strict} name={message} subject="valid" />
			<FieldMetadata strict={strict} name={message} subject="errors" />
		</ul>
	);

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<Playground title="Fine-grained Subscription" description={description}>
					<Field label="Name">
						<input {...getInputProps(fields.name)} />
					</Field>
					<Field label="Message">
						<textarea {...getTextareaProps(fields.message)} rows={6} />
					</Field>
					<div className="flex flex-row gap-2">
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.getControlButtonProps(
								control.reset({ name: fields.message.name }),
							)}
						>
							Reset message
						</button>
					</div>
				</Playground>
			</Form>
		</FormProvider>
	);
}

function useRenderCount(isStrcitMode: boolean): number {
	const ref = useRef(0);

	ref.current += 1;

	if (isStrcitMode) {
		return ref.current;
	}

	// The render count will go from 1, 3, 5, 7, ... in strict mode
	// This resolves it to 1, 2, 3, 4, ...
	return (ref.current + 1) / 2;
}

const FieldMetadata = memo(function FieldMetadata({
	name,
	subject,
	strict,
}: {
	name: FieldName<string>;
	subject: keyof FieldMetadata<string>;
	strict: boolean;
}) {
	const renderCount = useRenderCount(strict);
	const [field] = useField(name);

	// eslint-disable-next-line no-console
	console.log(`${name}.${subject}: ${JSON.stringify(field[subject])}`);

	return <li>{`${name}.${subject}: ${renderCount}`}</li>;
});

const FormMetadata = memo(function FormMetadata({
	formId,
	subject,
	strict,
}: {
	formId: FormId;
	subject: keyof FormMetadata<Record<string, any>>;
	strict: boolean;
}) {
	const renderCount = useRenderCount(strict);
	const form = useFormMetadata(formId);

	// eslint-disable-next-line no-console
	console.log(`form.${subject}: ${JSON.stringify(form[subject])}`);

	return <li>{`form.${subject}: ${renderCount}`}</li>;
});
